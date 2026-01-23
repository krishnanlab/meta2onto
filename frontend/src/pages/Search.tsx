import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isEmpty } from "lodash";
import { Calendar, Check, Dna, Hash, Logs, Plus } from "lucide-react";
import { studySamples, studySearch } from "@/api/api";
import { addToCart, cartAtom, inCart, removeFromCart } from "@/cart";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Database from "@/components/Database";
import Dialog from "@/components/Dialog";
import { getCartRef } from "@/components/Header";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";
import Meter from "@/components/Meter";
import Pagination from "@/components/Pagination";
import type { Limit } from "@/components/Pagination";
import Select from "@/components/Select";
import Status from "@/components/Status";
import { SearchBox } from "@/pages/Home";
import { fly } from "@/util/dom";
import { formatDate, formatNumber } from "@/util/string";

/** per page select options */
const limitOptions = [
  { value: "5" },
  { value: "10" },
  { value: "20" },
  { value: "50" },
  { value: "100" },
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
  const [params, setParams] = useSearchParams();

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
    [...params.keys()].map((key) => [key, params.getAll(key)]),
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

  const filtersPanel = (
    <div
      className="
        flex w-auto flex-col gap-4 rounded-sm bg-slate-100 p-4
        max-sm:w-full max-sm:flex-row max-sm:flex-wrap
      "
    >
      {/* facets */}
      {isEmpty(query.data?.facets) && (
        <span className="text-slate-500">Filters</span>
      )}
      {Object.entries(query.data?.facets ?? {}).map(([facet, values]) => (
        <div key={facet} className="flex flex-col gap-2">
          <strong>{facet}</strong>
          {Object.entries(values).map(([value, count]) => (
            <Checkbox
              key={value}
              value={params.getAll(facet).includes(value)}
              onChange={(checked) => {
                setParams((params) => {
                  if (checked) {
                    if (!params.has(facet, value)) params.append(facet, value);
                  } else params.delete(facet, value);
                  return params;
                });
              }}
            >
              {value} ({count})
            </Checkbox>
          ))}
        </div>
      ))}
    </div>
  );

  const resultsPanel = (
    <div className="flex w-full grow basis-0 flex-col gap-4">
      {/* search box */}
      <SearchBox />

      {/* query status */}
      <Status query={query} />

      {/* overview */}
      {query.data?.results && (
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <strong>{formatNumber(query.data?.count)}</strong> results
          </div>

          <label>
            Sort
            <Select
              options={orderingOptions}
              value={ordering}
              onChange={(checked) =>
                setParams((params) => {
                  params.set("ordering", checked);
                  return params;
                })
              }
            />
          </label>
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
          },
          index,
        ) => (
          <div
            key={index}
            className="
              flex flex-col gap-2 rounded-sm border border-slate-300 p-4
            "
          >
            <div className="flex items-start justify-between gap-2">
              <strong>{title}</strong>
              <Meter value={confidence.value}>{confidence.name}</Meter>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
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

            <p
              tabIndex={0}
              className="truncate-lines"
              dangerouslySetInnerHTML={{ __html: summary }}
            />

            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {database.map((database, index) => (
                  <Database key={index} database={database} />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Dialog
                  trigger={
                    <Button color="theme">
                      <Logs />
                      {formatNumber(samples)} Samples
                    </Button>
                  }
                  title={
                    <>
                      <span>
                        Samples for <strong>{gse}</strong>
                      </span>
                      <span className="text-sm text-slate-500">{title}</span>
                    </>
                  }
                  content={<Samples id={gse} />}
                />
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
          setParams((params) => {
            params.set("offset", String(page));
            return params;
          })
        }
        limit={limit}
        setLimit={(limit) =>
          setParams((params) => {
            params.set("limit", limit);
            return params;
          })
        }
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
            flex items-start gap-4
            max-sm:flex-col
          "
        >
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
