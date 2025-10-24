import { useParams, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isEmpty } from "lodash";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Dna,
  Download,
  Hash,
  Logs,
  Plus,
} from "lucide-react";
import { studySamples, studySearch } from "@/api/api";
import { addToCart, cartAtom, inCart, removeFromCart } from "@/cart";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Dialog from "@/components/Dialog";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";
import Meter from "@/components/Meter";
import Select from "@/components/Select";
import Status, { showStatus } from "@/components/Status";
import { SearchBox } from "@/pages/Home";

const sortOptions = [
  { id: "relevance", value: "Relevance" },
  { id: "date", value: "Date" },
  { id: "samples", value: "Samples" },
] as const;

export const Search = () => {
  const { search = "" } = useParams<{ search: string }>();

  /** url search params state */
  const [params, setParams] = useSearchParams();

  /** sort state from url params */
  const sort =
    sortOptions.find((option) => option.id === params.get("sort"))?.id ??
    sortOptions[0].id;

  /** page state from url params */
  const page = Number(params.get("page")) || 0;

  /** selected facets state from url params */
  const facets = Object.fromEntries(
    params.keys().map((key) => [key, params.getAll(key)]),
  );
  /** exclude param keywords */
  delete facets.sort;
  delete facets.page;

  /** page title */
  const title = `Search "${search}"`;

  /** search results */
  const query = useQuery({
    queryKey: ["full-search", search, sort, page, facets],
    queryFn: () => studySearch({ search, sort, page, facets }),
    placeholderData: keepPreviousData,
  });

  const cart = useAtomValue(cartAtom);

  const filtersPanel = (
    <div className="flex min-w-20 flex-col gap-4 rounded bg-slate-100 p-4">
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
    <div className="flex grow-1 basis-0 flex-col gap-4">
      {/* search box */}
      <SearchBox />

      {/* query status */}
      <Status query={query} />

      {/* overview */}
      {query.data?.results && (
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <b>{query.data?.results.length.toLocaleString()}</b> results
          </div>
          <label>
            Sort:
            <Select
              options={sortOptions}
              value={
                sortOptions.find((option) => option.id === sort)?.id ??
                "relevance"
              }
              onChange={(checked) =>
                setParams((params) => {
                  params.set("sort", checked);
                  return params;
                })
              }
            />
          </label>
        </div>
      )}

      {/* results */}
      {query.data?.results.map(
        ({
          id,
          name,
          description,
          confidence,
          database,
          samples,
          date,
          platform,
        }) => (
          <div
            key={id}
            className="border-theme-light flex flex-col gap-2 rounded border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <strong>{name}</strong>
              <Meter value={confidence.value}>{confidence.name}</Meter>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  [Hash, id],
                  [Calendar, date],
                  [Dna, platform],
                ] as const
              ).map(([Icon, text], index) => (
                <div key={index} className="text-theme flex items-center gap-2">
                  <Icon />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <p
              /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
              tabIndex={0}
              className="truncate-lines"
              dangerouslySetInnerHTML={{ __html: description }}
            />

            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {database.map((database) => (
                  <span key={database} className="bg-theme-light rounded px-1">
                    {database}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Dialog
                  title={
                    <>
                      <span>
                        Samples for <strong>{id}</strong>
                      </span>
                      <span className="text-sm text-slate-500">{name}</span>
                    </>
                  }
                  content={<Samples id={id} />}
                >
                  <Button color="theme">
                    <Logs />
                    {samples.toLocaleString()} Samples
                  </Button>
                </Dialog>
                <Button
                  aria-label={
                    inCart(cart, id) ? "Remove from cart" : "Add to cart"
                  }
                  color={inCart(cart, id) ? "none" : "accent"}
                  onClick={() =>
                    inCart(cart, id) ? removeFromCart(id) : addToCart(id)
                  }
                >
                  {inCart(cart, id) ? <Check /> : <Plus />}
                  Cart
                </Button>
              </div>
            </div>
          </div>
        ),
      )}

      {/* pagination */}
      <div className="flex justify-center gap-2">
        <Button
          disabled={page === 0}
          onClick={() =>
            setParams((params) => {
              params.set("page", String(page - 1));
              return params;
            })
          }
        >
          <ChevronLeft />
          Prev
        </Button>
        <Button
          disabled={page >= (query.data?.meta.pages ?? 1) - 1}
          onClick={() =>
            setParams((params) => {
              params.set("page", String(page + 1));
              return params;
            })
          }
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Meta title={title} />

      <Heading level={1} className="sr-only">
        Search results for "{search}"
      </Heading>

      <section>
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          {filtersPanel}
          {resultsPanel}
        </div>
      </section>
    </>
  );
};

export default Search;

/** samples popup */
const Samples = ({ id }: { id: string }) => {
  const query = useQuery({
    queryKey: ["sample-lookup", id],
    queryFn: () => studySamples(id),
  });

  return (
    <>
      <div className="flex flex-col gap-4 overflow-y-auto">
        <Status query={query} />

        {!showStatus({ query }) &&
          query.data?.map((sample) => (
            <div key={sample.name} className="flex flex-col gap-1">
              <strong>{sample.name}</strong>
              <p dangerouslySetInnerHTML={{ __html: sample.description }} />
            </div>
          ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {query.data && (
          <Button>
            <Download />
            Download
          </Button>
        )}
      </div>
    </>
  );
};
