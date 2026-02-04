import type { UseQueryResult } from "@tanstack/react-query";
import type { Studies, Study } from "@/api/types";
import type { Limit } from "@/components/Pagination";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useTimeout } from "@reactuses/core";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { isEmpty } from "lodash";
import {
  Calendar,
  Check,
  Dna,
  Hash,
  LoaderCircle,
  Logs,
  MessageCircleWarning,
  Plus,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { studyFeedback, studySamples, studySearch } from "@/api/api";
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
import { clearFeedback, feedbackAtom, setFeedback } from "@/state/feedback";
import { fly } from "@/util/dom";
import { useChanged, useDebouncedParams } from "@/util/hooks";
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

type LimitOption = (typeof limitOptions)[number]["value"];

/** sort select options */
const orderingOptions = [
  { value: "relevance" },
  { value: "date" },
  { value: "samples" },
] as const;

type OrderingOption = (typeof orderingOptions)[number]["value"];

export default function Search() {
  const { search = "" } = useParams<{ search: string }>();

  /** url search params state */
  const [params, setParams, debouncedParams] = useDebouncedParams();
  const raw = params.get("raw") ?? "";

  /** new search button */
  const [newSearch, setNewSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (newSearch) searchRef.current?.focus();
  }, [newSearch]);

  /** reset when search changes */
  if (useChanged(search)) setNewSearch(false);

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
          {newSearch && (
            <div
              className="
                col-span-full flex flex-wrap items-center justify-center gap-8
              "
            >
              <SearchBox className="grow" inputRef={searchRef} />
            </div>
          )}

          <Filters
            raw={raw}
            search={search}
            params={params}
            setParams={setParams}
            newSearch={newSearch}
            setNewSearch={setNewSearch}
            ordering={ordering}
            query={query}
          />

          <Results
            setParams={setParams}
            offset={offset}
            limit={limit}
            query={query}
          />
        </div>
      </section>
    </>
  );
}

/** filters panel */
const Filters = ({
  raw,
  search,
  params,
  setParams,
  newSearch,
  setNewSearch,
  ordering,
  query,
}: {
  raw: string;
  search: string;
  params: URLSearchParams;
  setParams: ReturnType<typeof useDebouncedParams>[1];
  newSearch: boolean;
  setNewSearch: (value: boolean) => void;
  ordering: OrderingOption;
  query: UseQueryResult<Studies>;
}) => (
  <div
    className="
      flex w-50 flex-col gap-8
      max-md:w-full max-md:flex-row max-md:flex-wrap
    "
  >
    {/* overview */}
    <div className="flex flex-col gap-2">
      <div>
        Searched "<strong>{raw}</strong>"
      </div>
      <div>
        Selected "<strong>{search}</strong>"
      </div>
      <div>
        <strong>
          {query.data?.count ? formatNumber(query.data.count) : "-"}
        </strong>{" "}
        results
      </div>
    </div>

    {/* sort */}
    <Select
      label={<strong>Sort</strong>}
      options={orderingOptions}
      value={ordering}
      onChange={(checked) =>
        setParams((params) => params.set("ordering", checked))
      }
    />

    {/* facet filter */}
    {isEmpty(query.data?.facets) && (
      <span className="text-slate-500">Filters</span>
    )}
    {Object.entries(query.data?.facets ?? {}).map(([facetKey, facetValues]) => (
      <div key={facetKey} className="flex flex-col gap-2">
        <strong>{facetKey}</strong>

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
                const [min = facetValues.min, max = facetValues.max] = values;
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
    ))}

    {!newSearch && (
      <Button onClick={() => setNewSearch(true)}>
        <RefreshCcw />
        New Search
      </Button>
    )}
  </div>
);

/** results panel */
const Results = ({
  setParams,
  offset,
  limit,
  query,
}: {
  setParams: ReturnType<typeof useDebouncedParams>[1];
  offset: number;
  limit: LimitOption;
  query: UseQueryResult<Studies>;
}) => (
  <div className="flex flex-col gap-8">
    {/* query status */}
    <Status query={query} />

    {/* results */}
    {query.data?.results.map((result, index) => (
      <Result key={index} {...result} />
    ))}

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

/** search result */
const Result = ({
  gse,
  title,
  summary,
  confidence,
  database,
  samples,
  submission_date,
  platform,
  keywords,
}: Study) => {
  /** current cart state */
  const cart = useAtomValue(cartAtom);

  /** feedback for this study */
  const feedback = useAtomValue(feedbackAtom)[gse];

  const mutation = useMutation({
    mutationKey: ["study-samples"],
    mutationFn: async () => feedback && (await studyFeedback(gse, feedback)),
  });

  return (
    <div className="flex flex-col gap-4 rounded-sm p-6 shadow-md">
      {/* top row */}
      <div className="flex items-start justify-between gap-8">
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
          <div key={index} className="flex items-center gap-2 text-slate-500">
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* databases */}
        <div className="flex flex-wrap gap-4">
          {database.map((database, index) => (
            <Database key={index} database={database} />
          ))}
        </div>

        {/* action buttons */}
        <div className="flex flex-wrap gap-4">
          {/* feedback */}
          {confidence.value > feedbackThreshold && (
            <Popover
              content={<FeedbackPopup id={gse} keywords={keywords} />}
              onClose={mutation.mutate}
            >
              <Button color="none">
                {mutation.status === "error" ? (
                  <TriangleAlert />
                ) : mutation.status === "pending" ? (
                  <LoaderCircle className="animate-spin" />
                ) : feedback ? (
                  <Check />
                ) : (
                  <MessageCircleWarning />
                )}
                Feedback
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
            content={<SamplesPopup id={gse} />}
          >
            <Button color="theme">
              <Logs />
              {formatNumber(samples)} Samples
            </Button>
          </Dialog>

          {/* cart */}
          <Button
            aria-label={inCart(cart, gse) ? "Remove from cart" : "Add to cart"}
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
  );
};

const qualities = [
  "Lorem ipsum dolor sit amet",
  "Consectetur adipiscing elit",
  "Sed do eiusmod tempor incididunt",
];

/** study feedback */
const FeedbackPopup = ({
  id,
  keywords,
}: {
  id: string;
  keywords: string[];
}) => {
  /** feedback for this study */
  const feedback = useAtomValue(feedbackAtom)[id];

  /** saved notification timer */
  const [saved, resetSaved] = useTimeout(1000);

  if (useChanged(feedback)) resetSaved();

  return (
    <div
      className="
        grid max-h-100 max-w-100 grow grid-cols-2
        grid-rows-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-4 gap-y-2
        leading-normal
        *:max-h-full
        max-md:grid-cols-1
      "
    >
      {/* headings */}
      <em>Study qualities</em>
      <em>Keyword relevance</em>

      {/* qualities */}
      <div className="flex flex-col overflow-y-auto">
        {qualities.map((quality, index) => (
          <Checkbox
            key={index}
            value={feedback?.qualities?.includes(quality) ?? false}
            onChange={(value) => {
              /** uncheck */
              if (!value)
                setFeedback(id, "qualities", (old) =>
                  old.filter((q) => q !== quality),
                );
              else
                /** check */
                setFeedback(id, "qualities", (old) =>
                  qualities.filter((q) => old.includes(q) || q === quality),
                );
            }}
          >
            {quality}{" "}
          </Checkbox>
        ))}
      </div>

      {/* keywords */}
      <div
        className="
          grid max-h-full grid-cols-[1fr_auto_auto] items-center overflow-auto
        "
      >
        {keywords.map((keyword, index) => (
          <Fragment key={index}>
            <span className="truncate py-1 pr-1">{keyword}</span>
            <Button
              color={
                feedback?.keywords?.[keyword] === "good" ? undefined : "none"
              }
              onClick={() =>
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] ? "" : "good",
                }))
              }
              aria-label="Up-vote keyword"
            >
              <ThumbsUp />
            </Button>
            <Button
              color={
                feedback?.keywords?.[keyword] === "bad" ? undefined : "none"
              }
              onClick={() =>
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] ? "" : "bad",
                }))
              }
              aria-label="Down-vote keyword"
            >
              <ThumbsDown />
            </Button>
          </Fragment>
        ))}
      </div>

      {/* elaborate */}
      <Textbox
        multi
        className="col-span-full mt-2 resize-none"
        placeholder="Elaborate"
        value={feedback?.elaborate ?? ""}
        onChange={(value) => setFeedback(id, "elaborate", value)}
      />

      {/* actions */}
      <div className="col-span-full flex items-center justify-end gap-4 pt-2">
        <div
          className={clsx(
            "text-slate-500 transition-opacity",
            saved ? "opacity-100" : "opacity-0",
          )}
        >
          Changes saved
        </div>
        <Button color="none" onClick={() => clearFeedback(id)}>
          <Trash2 />
          Clear
        </Button>
      </div>
    </div>
  );
};

/** samples popup */
const SamplesPopup = ({ id }: { id: string }) => {
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
