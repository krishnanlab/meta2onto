import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { quickSearch, typeColor } from "@/api/api";
import Link from "@/components/Link";
import Search from "@/components/Search";
import Status from "@/components/Status";

export const Home = () => {
  const navigate = useNavigate();

  /** search string state */
  const [search, setSearch] = useState("");

  /** search results */
  const { data, status } = useQuery({
    queryKey: ["quick-search", search],
    queryFn: () => quickSearch(search),
  });

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
            data?.map(({ type, name, description }) => ({
              id: name,
              content: (
                <Link to={`/search/${name}`}>
                  <span
                    className={clsx(
                      "rounded-full px-1 text-sm leading-none text-white",
                      typeColor[type] ?? typeColor["default"],
                    )}
                  >
                    {type}
                  </span>
                  <span className="font-normal">{name}</span>
                  <span
                    className="text-slate-500"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </Link>
              ),
            })) ?? []
          }
          onSelect={(id) => id?.trim() && navigate(`/search/${id}`)}
          extraRows={[
            <Status status={status} data={data} className="contents!" />,
          ]}
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
