import { useParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Logs, Plus } from "lucide-react";
import { fullSearch } from "@/api/api";
import Button from "@/components/Button";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";
import Status from "@/components/Status";

export const Search = () => {
  const { search = "" } = useParams<{ search: string }>();

  const title = `Search for "${search}"`;

  /** search results */
  const { data, status } = useQuery({
    queryKey: ["full-search", search],
    queryFn: () => fullSearch(search),
    placeholderData: keepPreviousData,
  });

  const statusBlock = status !== "success" && (
    <Status status={status} data={data?.results} />
  );

  const filtersPanel = (
    <div className="flex min-w-20 flex-col gap-4 rounded bg-slate-100 p-4">
      {data?.facets ? (
        Object.entries(data.facets).map(([facet, values]) => (
          <div key={facet} className="flex flex-col gap-2">
            <strong>{facet}</strong>
            {Object.entries(values).map(([value, count]) => (
              <label key={value}>
                <input type="checkbox" />
                {value} ({count})
              </label>
            ))}
          </div>
        ))
      ) : (
        <div className="text-slate-500">Filters</div>
      )}
    </div>
  );

  const resultsPanel = (
    <div className="flex grow-1 basis-0 flex-col gap-4">
      {statusBlock}

      {data?.results.map(({ id, name, description, confidence, database }) => (
        <div
          key={id}
          className="flex flex-col gap-2 rounded border border-slate-300 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <strong>{name}</strong>
            <div
              className={"flex gap-1 rounded bg-slate-100 px-1"}
              style={{
                backgroundColor: `color-mix(in hsl, transparent, #10b981 ${50 * confidence.value}%)`,
              }}
            >
              <span>{confidence.name}</span>
              <span>{(100 * confidence.value).toFixed(0)}%</span>
            </div>
          </div>
          <p dangerouslySetInnerHTML={{ __html: description }} />

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {database.map((db) => (
                <span key={db} className="rounded bg-slate-200 px-1">
                  {db}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Button aria-label="View samples">
                <Logs />
                <span>Samples</span>
              </Button>
              <Button color="primary" aria-label="Add to cart">
                <Plus />
                <span>Cart</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Meta title={title} />

      <section className="bg-light">
        <Heading level={1}>"{search}"</Heading>
      </section>

      <section className="full">
        <div className="flex gap-4">
          {filtersPanel}
          {resultsPanel}
        </div>
      </section>
    </>
  );
};

export default Search;
