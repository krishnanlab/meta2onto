import type { UseQueryResult } from "@tanstack/react-query";
import type { ColumnSort } from "@tanstack/table-core";
import type { Studies, Study } from "@/api/types";
import type { Limit } from "@/components/Pagination";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useDebounce, useLocalStorage } from "@reactuses/core";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { isEmpty, size, upperFirst } from "lodash";
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
import DatabaseBadge from "@/components/Database";
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
import Table from "@/components/Table";
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
  const studySearchQuery = useQuery({
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
            query={studySearchQuery}
          />

          <Results
            setParams={setParams}
            offset={offset}
            limit={limit}
            query={studySearchQuery}
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

const userIdKey = "user-self-id";

/** search result */
const Result = ({
  id,
  name,
  description,
  confidence,
  database,
  sample_count,
  submitted_at,
  platform,
  keywords,
}: Study) => {
  /** current cart state */
  const cart = useAtomValue(cartAtom);

  /** feedback for this study */
  const feedback = useAtomValue(feedbackAtom)[id];

  /** user self-identification */
  const [user] = useLocalStorage(userIdKey, "");

  const mutation = useMutation({
    mutationKey: ["study-samples"],
    mutationFn: async () =>
      feedback && (await studyFeedback(id, feedback, user || "")),
  });

  return (
    <div className="flex flex-col gap-4 rounded-sm p-6 shadow-md">
      {/* top row */}
      <div className="flex items-start justify-between gap-8">
        <strong>{name}</strong>
        <Meter value={confidence.value}>{confidence.name}</Meter>
      </div>

      {/* details */}
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {(
          [
            [Hash, id],
            [Calendar, formatDate(submitted_at)],
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
        dangerouslySetInnerHTML={{ __html: description }}
      />

      {/* bottom row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* databases */}
        <div className="flex flex-wrap gap-4">
          {database.map((database, index) => (
            <DatabaseBadge key={index} study={id} database={database} />
          ))}
        </div>

        {/* actions */}
        <div className="ml-auto flex flex-wrap gap-4">
          {/* feedback */}
          {confidence.value > feedbackThreshold && (
            <Popover
              content={<FeedbackPopup id={id} keywords={keywords} />}
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
                Samples for <strong>{id}</strong>
              </span>
            }
            subtitle={name}
            content={<SamplesPopup id={id} />}
          >
            <Button color="theme">
              <Logs />
              {formatNumber(sample_count)} Samples
            </Button>
          </Dialog>

          {/* cart */}
          <Button
            aria-label={inCart(cart, id) ? "Remove from cart" : "Add to cart"}
            color={inCart(cart, id) ? "none" : "accent"}
            onClick={(event) => {
              const cartRef = getCartRef();
              if (inCart(cart, id)) {
                removeFromCart(id);
                if (cartRef) fly(cartRef, event.currentTarget);
              } else {
                addToCart(id);
                if (cartRef) fly(event.currentTarget, cartRef);
              }
            }}
          >
            {inCart(cart, id) ? <Check /> : <Plus />}
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

  /** user self-identification */
  const [user, setUser] = useLocalStorage(userIdKey, "");

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
              color="none"
              className={clsx(
                "p-2",
                feedback?.keywords?.[keyword] === "good"
                  ? "text-emerald-600!"
                  : "text-slate-300!",
              )}
              onClick={() =>
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] === "good" ? "" : "good",
                }))
              }
              aria-label="Up-vote keyword"
            >
              <ThumbsUp />
            </Button>
            <Button
              color="none"
              className={clsx(
                "p-2",
                feedback?.keywords?.[keyword] === "bad"
                  ? "text-red-600!"
                  : "text-slate-300!",
              )}
              onClick={() =>
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] === "bad" ? "" : "bad",
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

      <div className="col-span-full flex items-center justify-end gap-4 pt-2">
        <Textbox
          value={user || ""}
          onChange={setUser}
          placeholder="Name/contact/etc. (opt-in)"
          className="grow"
        />
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
  const [_search, setSearch] = useState("");
  const search = useDebounce(_search, 500);
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

  const studySamplesQuery = useQuery({
    queryKey: ["study-samples", id, search, ordering, offset, limit],
    queryFn: () =>
      studySamples({
        id,
        search,
        ordering: (ordering.desc ? "-" : "") + ordering.id,
        offset,
        limit: Number(limit),
      }),
    placeholderData: keepPreviousData,
  });

  /** count unique values in each column */
  const counts: Record<string, Record<string, number>> = {};
  for (const row of studySamplesQuery.data?.results ?? [])
    for (let [key, value] of Object.entries(row)) {
      counts[key] ??= {};
      value = String(value);
      counts[key][value] = (counts[key][value] || 0) + 1;
    }

  /** cols with all same value */
  const common = Object.fromEntries(
    Object.entries(counts)
      .filter(([, value]) => size(Object.values(value)) === 1)
      .map(([key, uniques]) => {
        const value = Object.keys(uniques)[0]!;
        return [key, value];
      }),
  );

  /** whether to show extra columns */
  const [allCols, setAllCols] = useState(false);

  const baseCols = [
    { key: "id", name: "ID" },
    { key: "type", name: "Type" },
    { key: "description", name: "Description" },
  ] as const;

  const extraCols = [
    { key: "created_at", name: "Created At" },
    { key: "updated_at", name: "Updated At" },
  ] as const;

  const cols = allCols ? [...baseCols, ...extraCols] : baseCols;

  return (
    <>
      <div className="flex flex-col gap-4 overflow-y-auto">
        {!isEmpty(common) && (
          <dl>
            {Object.entries(common).map(([key, value]) => (
              <Fragment key={key}>
                <dt>{upperFirst(key)}</dt>
                <dd>{value}</dd>
              </Fragment>
            ))}
          </dl>
        )}

        <div className="relative">
          <Status
            query={studySamplesQuery}
            className="absolute inset-0 opacity-90"
          />
          <Table
            cols={cols}
            rows={studySamplesQuery.data?.results ?? []}
            sort={ordering}
            onSort={setOrdering}
            page={offset}
            perPage={Number(limit)}
          />
        </div>
      </div>

      {/* pagination */}
      <Pagination
        count={studySamplesQuery.data?.count ?? 0}
        offset={offset}
        setOffset={setOffset}
        limit={limit}
        setLimit={setLimit}
      >
        <Checkbox value={allCols} onChange={setAllCols}>
          All columns
        </Checkbox>
        <Textbox
          value={_search}
          onChange={setSearch}
          placeholder="Search"
          className="grow"
        />
      </Pagination>
    </>
  );
};
