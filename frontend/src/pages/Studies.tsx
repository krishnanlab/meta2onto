import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ColumnSort } from "@tanstack/table-core";
import type { Sample, Studies, Study } from "@/api/types";
import type { Limit } from "@/components/Pagination";
import type { Col } from "@/components/Table";
import { Fragment, useEffect, useRef, useState } from "react";
import analytics from "react-ga4";
import Highlighter from "react-highlight-words";
import { useParams } from "react-router";
import { useDebounce } from "@reactuses/core";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { isEmpty, size, upperFirst } from "lodash";
import {
  Calendar,
  Check,
  CircleSmall,
  Dna,
  Hash,
  LoaderCircle,
  Logs,
  Minus,
  Plus,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { studyFeedback, studySamples, studySearch } from "@/api/api";
import { performanceColor, performanceTooltip, typeColor } from "@/api/maps";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Combobox from "@/components/Combobox";
import Database from "@/components/Database";
import Dialog from "@/components/Dialog";
import { getCartRef } from "@/components/Header";
import { H1, H3 } from "@/components/Heading";
import Link from "@/components/Link";
// import Link from "@/components/Link";
import Meta from "@/components/Meta";
import Meter from "@/components/Meter";
import Pagination from "@/components/Pagination";
import Pill from "@/components/Pill";
import Popover from "@/components/Popover";
import Select from "@/components/Select";
import Slider from "@/components/Slider";
import Status from "@/components/Status";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import Tooltip from "@/components/Tooltip";
import { SearchBox } from "@/pages/Home";
import { useUser } from "@/pages/user";
import { addToCart, cartAtom, inCart, removeFromCart } from "@/state/cart";
import { clearFeedback, feedbackAtom, setFeedback } from "@/state/feedback";
import { fly } from "@/util/dom";
import { useChanged, useDebouncedParams } from "@/util/hooks";
import { formatDate, formatNumber } from "@/util/string";

/** don't show feedback if confidence below this */
const feedbackThreshold = 0.75;

/**
 * if facet has more than this many unique values, use combobox instead of
 * checkboxes
 */
const facetThreshold = 10;

/** per page select options */
const limitOptions = [
  { value: "5" },
  { value: "10" },
  { value: "20" },
  { value: "50" },
  { value: "100" },
] as const;

type LimitOption = (typeof limitOptions)[number]["value"];

/** sort select options */
const orderingOptions = [
  { value: "relevance" },
  { value: "date" },
  { value: "samples" },
] as const;

type OrderingOption = (typeof orderingOptions)[number]["value"];

export default function Studies() {
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
  const title = `${search} "${raw}"`;

  /** search results */
  const studySearchQuery = useQuery({
    queryKey: ["studySearch", search, ordering, offset, limit, facets],
    queryFn: () =>
      studySearch({ search, ordering, offset, limit: Number(limit), facets }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Meta title={title} />

      <H1 className="sr-only">Search results for "{search}"</H1>

      <section className="width-lg">
        <div className="grid grid-cols-[auto_1fr] gap-12 max-md:grid-cols-1">
          {newSearch && (
            <div className="col-span-full flex flex-wrap items-center justify-center gap-8">
              <SearchBox className="grow" inputRef={searchRef} />
            </div>
          )}

          <Filters
            raw={raw}
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

type FiltersProps = {
  raw: string;
  params: URLSearchParams;
  setParams: ReturnType<typeof useDebouncedParams>[1];
  newSearch: boolean;
  setNewSearch: (value: boolean) => void;
  ordering: OrderingOption;
  query: UseQueryResult<Studies>;
};

/** filters panel */
function Filters({
  raw,
  params,
  setParams,
  newSearch,
  setNewSearch,
  ordering,
  query,
}: FiltersProps) {
  /** destructure query */
  const {
    count = 0,
    meta: { term = "", name = "", type = "", performance = "" } = {},
    facets = {},
  } = query.data ?? {};

  return (
    <div className="flex w-60 flex-col gap-8 max-md:w-full max-md:flex-row max-md:flex-wrap">
      {/* overview */}
      <dl>
        <dt className="text-sm text-stone-500">Raw Search</dt>
        <dd className="text-sm text-stone-500">"{raw}"</dd>
        <dt>Selection</dt>
        <dd>
          {type && <Pill value={type} color={typeColor} />}
          {name} {term}
        </dd>
        <dt>Performance</dt>
        <dd>
          <Pill
            value={performance}
            color={performanceColor}
            tooltip={performanceTooltip}
            className="w-full"
          />
        </dd>
        <dt>Results</dt>
        <dd>{count ? formatNumber(count) : "-"}</dd>
      </dl>

      {!newSearch && (
        <Button onClick={() => setNewSearch(true)}>
          <RefreshCcw />
          New Search
        </Button>
      )}

      {/* sort */}
      <Select
        label={<strong>Sort</strong>}
        options={orderingOptions}
        value={ordering}
        onChange={(checked) =>
          setParams((params) => params.set("ordering", checked))
        }
      />

      {Object.entries(facets).map(([facetKey, facetValues]) => {
        /** control to use for facet */
        let control: ReactNode;

        const { label, min, max } = facetValues;

        /** slider */
        if (
          typeof label === "string" &&
          typeof min === "number" &&
          typeof max === "number"
        )
          control = (
            <Slider
              label={(values) =>
                values.map((value) => formatNumber(value, true)).join(" – ")
              }
              thumbLabel={[`${facetKey} minimum`, `${facetKey} maximum`]}
              value={(() => {
                const [minValue, maxValue] =
                  params.get(facetKey)?.split("-").map(Number) ?? [];
                return [minValue ?? min, maxValue ?? max];
              })()}
              onChange={(values) =>
                setParams((params) => {
                  const [min = facetValues.min, max = facetValues.max] = values;
                  params.set(facetKey, `${min}-${max}`);
                })
              }
              min={min}
              max={max}
              step={max - min > 1 ? 1 : 0.01}
            />
          );
        /** combobox */ else if (size(facetValues) > facetThreshold)
          control = (
            <Combobox
              options={Object.keys(facetValues)}
              value={params.getAll(facetKey)}
              onChange={(value) =>
                setParams((params) => {
                  params.delete(facetKey);
                  value.forEach((v) => params.append(facetKey, v));
                })
              }
            />
          );
        /** checkbox */ else
          control = Object.entries(facetValues).map(
            ([facetValue, facetCount]) => (
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
                {facetValue} ({formatNumber(Number(facetCount), true)})
              </Checkbox>
            ),
          );

        return (
          <div key={facetKey} className="flex flex-col gap-2">
            <strong>{facetKey}</strong>
            {control}
          </div>
        );
      })}
    </div>
  );
}

/** results panel */
type ResultsProps = {
  setParams: ReturnType<typeof useDebouncedParams>[1];
  offset: number;
  limit: LimitOption;
  query: UseQueryResult<Studies>;
};

function Results({ setParams, offset, limit, query }: ResultsProps) {
  const anyFeedback = !!Object.values(useAtomValue(feedbackAtom)).length;

  /** destructure query */
  const { count = 0, results = [] } = query.data ?? {};

  return (
    <div className="flex flex-col gap-8">
      {anyFeedback && (
        <p>
          We especially appreciate feedback on{" "}
          <Link to="?Classification=Neutral">
            studies not in our training set
          </Link>
          !
        </p>
      )}

      {/* query status */}
      <Status query={query} />

      {/* results */}
      {results.map((result, index) => (
        <Result key={index} {...result} />
      ))}

      {/* pagination */}
      <Pagination
        count={count}
        offset={offset}
        setOffset={(page) =>
          setParams((params) => params.set("offset", String(page)))
        }
        limit={limit}
        setLimit={(limit) => setParams((params) => params.set("limit", limit))}
      />
    </div>
  );
}

/** search result */
function Result({
  id,
  name,
  description,
  confidence,
  database,
  sample_count,
  submitted_at,
  platform,
  classification,
  keywords,
  feedback: allFeedback,
}: Study) {
  /** current cart state */
  const cart = useAtomValue(cartAtom);

  /** feedback for this study */
  const feedback = useAtomValue(feedbackAtom)[id];

  /** user self-identification */
  const { userName, userEmail } = useUser();

  /** study top-level details */
  const details = [
    {
      icon: Hash,
      text: id,
      tooltip: "ID of study",
    },
    {
      icon: Calendar,
      text: formatDate(submitted_at),
      tooltip: "Date study was submitted",
    },
    {
      icon: Dna,
      text: platform?.join(", "),
      tooltip: "Platform used in study",
    },
    {
      icon:
        classification === "Positive"
          ? Plus
          : classification === "Negative"
            ? Minus
            : CircleSmall,
      text: classification,
      tooltip: "Classification of study in model training",
    },
  ] as const;

  /** feedback mutation */
  const mutation = useMutation({
    mutationFn: async () =>
      await studyFeedback(
        id,
        { name: userName ?? "", email: userEmail ?? "" },
        feedback,
      ),
  });

  /** feedback mutation status */
  const status =
    mutation.status === "error" ? (
      <TriangleAlert />
    ) : mutation.status === "pending" ? (
      <LoaderCircle className="animate-spin" />
    ) : null;

  return (
    <div className="flex flex-col gap-4 rounded-md p-6 shadow-md">
      {/* top row */}
      <div className="flex items-start justify-between gap-8">
        <strong>{name}</strong>
        <Meter value={confidence.value}>{confidence.name}</Meter>
      </div>

      {/* details */}
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {details.map(({ icon: Icon, text, tooltip }, index) =>
          text ? (
            <Tooltip key={index} content={tooltip}>
              <div className="flex items-center gap-2 text-stone-500">
                <Icon />
                <span>{text}</span>
              </div>
            </Tooltip>
          ) : null,
        )}
      </div>

      {/* description */}
      <p className="truncate-lines" tabIndex={0}>
        <Highlighter
          className="contents"
          highlightTag={({ children }) => (
            <Highlight keywords={keywords}>{children}</Highlight>
          )}
          caseSensitive
          searchWords={keywords}
          textToHighlight={description}
        />
      </p>

      {/* bottom row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* databases */}
        <div className="flex flex-wrap gap-4">
          {Object.keys(database).map((database, index) => (
            <Database key={index} database={database} study={id} />
          ))}
        </div>

        {/* actions */}
        <div className="ml-auto flex flex-wrap items-center justify-center gap-4">
          {/* feedback */}
          {confidence.value > feedbackThreshold && (
            <>
              {!!allFeedback.vote_count && (
                <span className="text-stone-500">
                  {formatNumber(allFeedback.vote_count)} others gave feedback
                </span>
              )}
              <Button
                color={feedback?.rating === 1 ? "theme" : "none"}
                onClick={() => {
                  setFeedback(id, "rating", (old) => (old === 1 ? 0 : 1));
                  mutation.mutate();
                }}
                title="Everything looks good (study prediction is accurate and keywords are relevant)"
                aria-disabled={!!status}
              >
                {status || <ThumbsUp />}
              </Button>
              <Popover
                content={<ThumbsDownPopup id={id} keywords={keywords} />}
                onClose={mutation.mutate}
              >
                <Button
                  color={feedback?.rating === -1 ? "theme" : "none"}
                  title="Something looks wrong (study prediction is incorrect and/or keywords are irrelevant)"
                  aria-disabled={!!status}
                >
                  {status || <ThumbsDown />}
                </Button>
              </Popover>
            </>
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
            onOpen={() => analytics.event("view_samples")}
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
                analytics.event("remove_from_cart", { id });
                if (cartRef) fly(cartRef, event.currentTarget);
              } else {
                addToCart(id);
                analytics.event("add_to_cart", { id });
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
}

type HighlightProps = {
  keywords: string[];
  children: ReactNode;
};

/** custom highlight */
export function Highlight({ keywords, children }: HighlightProps) {
  /** get position of highlight in keywords list */
  const index = typeof children === "string" ? keywords.indexOf(children) : -1;
  /** keywords listed first considered stronger matches */
  const strength = 1 - index / keywords.length;
  return (
    <mark className="relative isolate bg-transparent">
      <span
        className="absolute inset-0 -z-10 bg-orange-200"
        style={{ opacity: strength }}
      />
      {children}
    </mark>
  );
}

const qualities = ["Incorrect prediction", "Irrelevant/incorrect keywords"];

/** study negative feedback popup */
type ThumbsDownPopupProps = {
  id: string;
  keywords: string[];
};

function ThumbsDownPopup({ id, keywords }: ThumbsDownPopupProps) {
  /** feedback for this study */
  const feedback = useAtomValue(feedbackAtom)[id];

  /** user self-identification */
  const { userName, userEmail, setUserName, setUserEmail } = useUser();

  /** give negative rating, to be called on any change to popup */
  const thumbsDown = () => setFeedback(id, "rating", -1);

  return (
    <div className="grid max-h-100 max-w-100 grow grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-4 gap-y-2 leading-normal *:max-h-full max-md:grid-cols-1">
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
              thumbsDown();
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
            {quality}
          </Checkbox>
        ))}
      </div>

      {/* keywords */}
      <div className="grid max-h-full grid-cols-[1fr_auto_auto] items-center overflow-auto">
        {keywords.map((keyword, index) => (
          <Fragment key={index}>
            <span className="truncate py-1 pr-1">{keyword}</span>
            <Button
              color="none"
              className={clsx(
                "p-2",
                feedback?.keywords?.[keyword] === "good"
                  ? "text-emerald-600!"
                  : "text-stone-300!",
              )}
              onClick={() => {
                thumbsDown();
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] === "good" ? "" : "good",
                }));
              }}
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
                  : "text-stone-300!",
              )}
              onClick={() => {
                thumbsDown();
                setFeedback(id, "keywords", (old) => ({
                  ...old,
                  [keyword]: old[keyword] === "bad" ? "" : "bad",
                }));
              }}
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
        onChange={(value) => {
          thumbsDown();
          setFeedback(id, "elaborate", value);
        }}
      />

      <div className="col-span-full flex items-center justify-end gap-4 pt-2">
        <Textbox
          value={userName || ""}
          onChange={setUserName}
          placeholder="Name (opt-in)"
          className="grow"
        />
        <Textbox
          value={userEmail || ""}
          onChange={setUserEmail}
          placeholder="Email (opt-in)"
          className="grow"
        />
        <Button color="none" onClick={() => clearFeedback(id)}>
          <Trash2 />
          Clear
        </Button>
      </div>
    </div>
  );
}

/** samples popup */
type SamplesPopupProps = {
  id: string;
};

function SamplesPopup({ id }: SamplesPopupProps) {
  /** pagination */
  const [_search, setSearch] = useState("");
  const search = useDebounce(_search, 500);
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

  const query = useQuery({
    queryKey: ["studySamples", id, search, ordering, offset, limit],
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

  /** destructure query */
  const { count = 0, results = [] } = query.data ?? {};

  /** count unique values in each column */
  const counts: Record<string, Record<string, number>> = {};
  for (const row of results)
    for (let [key, value] of Object.entries(row)) {
      counts[key] ??= {};
      value = value ? String(value) : "-";
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

  const baseCols: Col<Sample>[] = [
    { key: "id", name: "ID" },
    { key: "type", name: "Type" },
    { key: "description", name: "Description" },
  ];

  const extraCols: Col<Sample>[] = [
    {
      key: "submission_date",
      name: "Created At",
      render: (cell) => (cell ? formatDate(cell) : "-"),
    },
    {
      key: "last_update_date",
      name: "Updated At",
      render: (cell) => (cell ? formatDate(cell) : "-"),
    },
  ];

  const cols = allCols ? [...baseCols, ...extraCols] : baseCols;

  return (
    <>
      <H3 className="justify-start">Common Sample Details</H3>
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

      <H3 className="justify-start">Individual Sample Details</H3>
      <div className="relative">
        <Status query={query} className="absolute inset-0 opacity-90" />
        <Table
          className="w-full"
          cols={cols}
          rows={results}
          sort={ordering}
          onSort={setOrdering}
          page={offset}
          perPage={Number(limit)}
        />
      </div>

      {/* pagination */}
      <Pagination
        count={count}
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
}
