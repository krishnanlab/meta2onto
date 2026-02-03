import type { Limit } from "@/components/Pagination";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isEmpty } from "lodash";
import {
  Calendar,
  Check,
  Dna,
  Hash,
  Logs,
  Plus,
  RefreshCcw,
  SearchIcon,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { studySamples, studySearch } from "@/api/api";
import Feedback from "@/assets/feedback.svg?react";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Database from "@/components/Database";
import Dialog from "@/components/Dialog";
import { getCartRef } from "@/components/Header";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";
import Meter from "@/components/Meter";
import Pagination from "@/components/Pagination";
import Popover from "@/components/Popover";
import Select from "@/components/Select";
import Slider from "@/components/Slider";
import Status from "@/components/Status";
import Textbox from "@/components/Textbox";
import { SearchBox } from "@/pages/Home";
import { addToCart, cartAtom, inCart, removeFromCart } from "@/state/cart";
import { fly } from "@/util/dom";
import { useDebouncedParams } from "@/util/hooks";
import { formatDate, formatNumber } from "@/util/string";

/** don't show feedback if confidence below this */
const feedbackThreshold = 0.75;

/** per page select options */
const limitOptions = [
  { value: "5" },
  { value: "10" },
  { value: "20" },
  { value: "50" },
  { value: "50" },
] as const;

/** sort select options */
const orderingOptions = [
  { value: "relevance" },
  { value: "date" },
  { value: "samples" },
] as const;

export default function Search() {
  const { search = "" } = useParams<{ search: string }>();

  /** url search params state */
  const [params, setParams, debouncedParams] = useDebouncedParams();
  const raw = params.get("raw") ?? "";

  /** ordering state from url params */
  const ordering =
    orderingOptions.find((option) => option.value === params.get("ordering"))
      ?.value ?? orderingOptions[0].value;

  /** pagination page state from url params */
  const offset = Number(params.get("offset")) || 0;

  /** pagination per page state from url params */
  const limit =
    limitOptions.find((option) => option.value === params.get("limit"))
      ?.value ?? limitOptions[1].value;

  /** selected facets state from url params */
  const facets = Object.fromEntries(
    [...debouncedParams.keys()].map((key) => [
      key,
      debouncedParams.getAll(key),
    ]),
  );
  /** exclude param keywords */
  delete facets.ordering;
  delete facets.offset;
  delete facets.limit;

  /** page title */
  const title = `Search "${search}"`;

  /** search results */
  const query = useQuery({
    queryKey: ["study-search", search, ordering, offset, limit, facets],
    queryFn: () =>
      studySearch({ search, ordering, offset, limit: Number(limit), facets }),
    placeholderData: keepPreviousData,
  });

  const cart = useAtomValue(cartAtom);

  /** new search button */
  const [newSearch, setNewSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (newSearch) searchRef.current?.focus();
  }, [newSearch]);

  const topPanel = (
    <div className="col-span-full flex flex-wrap items-center justify-center gap-8">
      {newSearch ? (
        <SearchBox className="grow" inputRef={searchRef} />
      ) : (
        <>
          <div className="flex items-center gap-2 leading-normal">
            <SearchIcon className="text-slate-400" />
            <span>
              Searched "<strong>{raw}</strong>" and selected "
              <strong>{search}</strong>"
            </span>
          </div>
          <Button color="none" onClick={() => setNewSearch(true)}>
            <RefreshCcw />
            New Search
          </Button>
        </>
      )}
    </div>
  );

  const filtersPanel = (
    <div
      className="
        flex w-50 flex-col gap-8
        max-md:w-full max-md:flex-row max-md:flex-wrap
      "
    >
      {/* facets */}
      {isEmpty(query.data?.facets) && (
        <span className="text-slate-500">Filters</span>
      )}
      {Object.entries(query.data?.facets ?? {}).map(
        ([facetKey, facetValues]) => (
          <div key={facetKey} className="flex flex-col gap-2">
            <strong className="leading-normal">{facetKey}</strong>

            {typeof facetValues.label === "string" &&
            typeof facetValues.min === "number" &&
            typeof facetValues.max === "number" ? (
              /** range facet */
              <Slider
                label={(values) => (
                  <>
                    {values.join(" – ")} {facetValues.label}
                  </>
                )}
                thumbLabel={[`${facetKey} minimum`, `${facetKey} maximum`]}
                value={(() => {
                  const [min = facetValues.min, max = facetValues.max] =
                    params.get(facetKey)?.split("-").map(Number) ?? [];
                  return [min, max];
                })()}
                onChange={(values) =>
                  setParams((params) => {
                    const [min = facetValues.min, max = facetValues.max] =
                      values;
                    params.set(facetKey, `${min}-${max}`);
                  })
                }
                min={facetValues.min}
                max={facetValues.max}
                step={facetValues.max - facetValues.min > 1 ? 1 : 0.01}
              />
            ) : (
              /** boolean facet */
              Object.entries(facetValues).map(([facetValue, facetCount]) => (
                <Checkbox
                  key={facetValue}
                  /** sync facet with url */
                  value={params.getAll(facetKey).includes(facetValue)}
                  onChange={(checked) => {
                    setParams((params) => {
                      if (checked) {
                        if (!params.has(facetKey, facetValue))
                          params.append(facetKey, facetValue);
                      } else params.delete(facetKey, facetValue);
                    });
                  }}
                >
                  {facetValue} ({facetCount})
                </Checkbox>
              ))
            )}
          </div>
        ),
      )}
    </div>
  );

  const resultsPanel = (
    <div className="flex flex-col gap-8">
      {/* query status */}
      <Status query={query} />

      {/* overview */}
      {query.data?.results && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <strong>{formatNumber(query.data?.count)}</strong> results
          </div>

          <Select
            label="Sort"
            options={orderingOptions}
            value={ordering}
            onChange={(checked) =>
              setParams((params) => params.set("ordering", checked))
            }
          />
        </div>
      )}

      {/* results */}
      {query.data?.results.map(
        (
          {
            gse,
            title,
            summary,
            confidence,
            database,
            samples,
            submission_date,
            platform,
            keywords,
          },
          index,
        ) => (
          <div
            key={index}
            className="flex flex-col gap-6 rounded-sm p-6 shadow-md"
          >
            {/* top row */}
            <div className="flex items-start justify-between gap-2 leading-normal">
              <strong>{title}</strong>
              <Meter value={confidence.value}>{confidence.name}</Meter>
            </div>

            {/* details */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {(
                [
                  [Hash, gse],
                  [Calendar, formatDate(submission_date)],
                  [Dna, platform],
                ] as const
              ).map(([Icon, text], index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-slate-500"
                >
                  <Icon />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* description */}
            <p
              tabIndex={0}
              className="truncate-lines"
              dangerouslySetInnerHTML={{ __html: summary }}
            />

            {/* bottom row */}
            <div className="flex flex-wrap items-end justify-between gap-2">
              {/* databases */}
              <div className="flex flex-wrap gap-2">
                {database.map((database, index) => (
                  <Database key={index} database={database} />
                ))}
              </div>

              {/* action buttons */}
              <div className="flex flex-wrap gap-2">
                {/* feedback */}
                {confidence.value > feedbackThreshold && (
                  <Popover
                    content={(close) => (
                      <div
                        className="
                          grid max-h-50 max-w-50 grow grid-cols-2
                          grid-rows-[auto_minmax(0,1fr)_auto] items-start gap-4
                          *:max-h-full
                          max-md:grid-cols-1
                        "
                      >
                        <div
                          className="
                            col-span-full flex items-center justify-between
                            gap-4
                          "
                        >
                          <strong>Give us feedback on this result</strong>
                          <span className="text-sm text-slate-500">
                            (Close to save changes)
                          </span>
                        </div>

                        <div className="flex flex-col overflow-y-auto">
                          <Checkbox>Lorem ipsum dolor sit amet</Checkbox>
                          <Checkbox>Consectetur adipiscing elit</Checkbox>
                          <Checkbox>Sed do eiusmod tempor incididunt</Checkbox>
                        </div>

                        <div
                          className="
                            grid max-h-full grid-cols-[1fr_auto_auto]
                            items-center gap-x-2 overflow-auto
                          "
                        >
                          {keywords.map((keyword, index) => (
                            <Fragment key={index}>
                              <span className="truncate py-1">{keyword}</span>
                              <Button color="none">
                                <ThumbsUp />
                              </Button>
                              <Button color="none">
                                <ThumbsDown />
                              </Button>
                            </Fragment>
                          ))}
                        </div>

                        <Textbox
                          multi
                          className="col-span-full resize-none"
                          placeholder="Elaborate"
                          onSubmit={close}
                        />
                      </div>
                    )}
                  >
                    <Button color="none">
                      <Feedback />
                    </Button>
                  </Popover>
                )}

                {/* samples */}
                <Dialog
                  title={
                    <span>
                      Samples for <strong>{gse}</strong>
                    </span>
                  }
                  subtitle={title}
                  content={<Samples id={gse} />}
                >
                  <Button color="theme">
                    <Logs />
                    {formatNumber(samples)} Samples
                  </Button>
                </Dialog>

                {/* cart */}
                <Button
                  aria-label={
                    inCart(cart, gse) ? "Remove from cart" : "Add to cart"
                  }
                  color={inCart(cart, gse) ? "none" : "accent"}
                  onClick={(event) => {
                    const cartRef = getCartRef();
                    if (inCart(cart, gse)) {
                      removeFromCart(gse);
                      if (cartRef) fly(cartRef, event.currentTarget);
                    } else {
                      addToCart(gse);
                      if (cartRef) fly(event.currentTarget, cartRef);
                    }
                  }}
                >
                  {inCart(cart, gse) ? <Check /> : <Plus />}
                  Cart
                </Button>
              </div>
            </div>
          </div>
        ),
      )}

      {/* pagination */}
      <Pagination
        count={query.data?.count ?? 0}
        offset={offset}
        setOffset={(page) =>
          setParams((params) => params.set("offset", String(page)))
        }
        limit={limit}
        setLimit={(limit) => setParams((params) => params.set("limit", limit))}
      />
    </div>
  );

  return (
    <>
      <Meta title={title} />

      <Heading level={1} className="sr-only">
        Search results for "{search}"
      </Heading>

      <section>
        <div
          className="
            grid grid-cols-[auto_1fr] gap-12
            max-md:grid-cols-1
          "
        >
          {topPanel}
          {filtersPanel}
          {resultsPanel}
        </div>
      </section>
    </>
  );
}

/** samples popup */
const Samples = ({ id }: { id: string }) => {
  /** pagination */
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

  const query = useQuery({
    queryKey: ["study-samples", id, offset, limit],
    queryFn: () => studySamples({ id, offset, limit: Number(limit) }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <div className="flex flex-col gap-4 overflow-y-auto">
        <Status query={query} />

        {query.data?.results.map((sample, index) => (
          <div key={index} className="flex flex-col gap-1">
            <strong>{sample.sample_id}</strong>
            <p dangerouslySetInnerHTML={{ __html: sample.doc }} />
          </div>
        ))}
      </div>

      {/* pagination */}
      <Pagination
        count={query.data?.count ?? 0}
        offset={offset}
        setOffset={setOffset}
        limit={limit}
        setLimit={setLimit}
      />
    </>
  );
};
