import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { InfoIcon, LoaderCircle, TriangleAlert } from "lucide-react";
import { sampleSearch, typeColor } from "@/api/api";
import Link from "@/components/Link";
import Search from "@/components/Search";

export const Home = () => {
  const navigate = useNavigate();

  /** search string state */
  const [search, setSearch] = useState("");

  /** search results */
  const { data: results, status } = useQuery({
    queryKey: ["sample-search", search],
    queryFn: () => sampleSearch(search),
  });

  let searchStatus: ReactNode;
  if (status === "pending")
    searchStatus = (
      <span className="contents text-slate-500">
        <LoaderCircle className="animate-spin" />
        Searching
      </span>
    );
  else if (status === "error")
    searchStatus = (
      <span className="contents text-red-500">
        <TriangleAlert />
        Error
      </span>
    );
  else if (status === "success" && results?.length === 0)
    searchStatus = (
      <span className="contents text-slate-500">
        <InfoIcon />
        No results
      </span>
    );

  return (
    <>
      <section className="narrow bg-light py-12! text-center">
        <hgroup className="flex flex-col items-center gap-y-1">
          <h1 className="sr-only">Home</h1>
          <p className="text-xl font-normal tracking-wide text-balance text-slate-700">
            Discover Human Transcriptomics Data
          </p>
          <p className="text-balance">
            Search millions of annotated samples across major databases
          </p>
        </hgroup>

        <Search
          search={search}
          onSearch={setSearch}
          placeholder="Search..."
          options={
            results?.map(({ type, name, description }) => ({
              id: name,
              content: (
                <Link to={`/search/${name}`}>
                  <span
                    className={clsx(
                      "rounded-full px-1 text-sm leading-none text-white",
                      typeColor[type],
                    )}
                  >
                    {type}
                  </span>
                  <span className="font-normal">{name}</span>
                  <span className="text-slate-500">{description}</span>
                </Link>
              ),
            })) ?? []
          }
          onSelect={(id) => navigate(`/search/${id}`)}
          extraRows={[searchStatus]}
        />
      </section>

      <section>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>
    </>
  );
};

export default Home;
