import { useParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Calendar, Dna, Hash, Logs, Plus } from "lucide-react";
import { fullSearch } from "@/api/api";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";
import Select from "@/components/Select";
import Status from "@/components/Status";

export const Search = () => {
  const { search = "" } = useParams<{ search: string }>();

  /** page title */
  const title = `Search for "${search}"`;

  /** search results */
  const { data, status } = useQuery({
    queryKey: ["full-search", search],
    queryFn: () => fullSearch(search),
    placeholderData: keepPreviousData,
  });

  const filtersPanel = (
    <div className="flex min-w-20 flex-col gap-4 rounded bg-slate-100 p-4">
      {/* facets */}
      {Object.entries(data?.facets ?? {}).map(([facet, values]) => (
        <div key={facet} className="flex flex-col gap-2">
          <strong>{facet}</strong>
          {Object.entries(values).map(([value, count]) => (
            <Checkbox>
              {value} ({count})
            </Checkbox>
          ))}
        </div>
      ))}
    </div>
  );

  const resultsPanel = (
    <div className="flex grow-1 basis-0 flex-col gap-4">
      {/* query status */}
      {status !== "success" && <Status status={status} data={data?.results} />}

      {/* overview */}
      {data?.results && (
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <b>{data?.results.length.toLocaleString()}</b> results for{" "}
            <b>"{search}"</b>
          </div>
          <label>
            Sort:
            <Select
              options={
                [
                  { id: "relevance", value: "Relevance" },
                  { id: "date", value: "Date" },
                  { id: "samples", value: "Samples" },
                ] as const
              }
            />
          </label>
        </div>
      )}

      {/* results */}
      {data?.results.map(
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
              <div
                className="flex gap-1 rounded px-1"
                style={{
                  backgroundColor: `color-mix(in hsl, transparent, #10b981 ${50 * confidence.value}%)`,
                }}
              >
                <span>{confidence.name}</span>
                <span>{(100 * confidence.value).toFixed(0)}%</span>
              </div>
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
                {database.map((db) => (
                  <span key={db} className="bg-theme-light rounded px-1">
                    {db}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button color="theme">
                  <Logs />
                  <span>{samples.toLocaleString()} Samples</span>
                </Button>
                <Button color="accent">
                  <Plus />
                  <span>Cart</span>
                </Button>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );

  return (
    <>
      <Meta title={title} />

      <Heading level={1} className="sr-only">
        Search results for "{search}"
      </Heading>

      <section className="">
        <div className="flex flex-col gap-4 sm:flex-row">
          {filtersPanel}
          {resultsPanel}
        </div>
      </section>
    </>
  );
};

export default Search;
