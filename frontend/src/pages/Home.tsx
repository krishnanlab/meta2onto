import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { History, Lightbulb } from "lucide-react";
import { modelSearch, typeColor } from "@/api/api";
import type { Model } from "@/api/types";
import Autocomplete from "@/components/Autocomplete";
import Link from "@/components/Link";
import Rings from "@/components/Rings";
import Status, { showStatus } from "@/components/Status";
import { addSearch, getHistory } from "@/search";

/** example searches */
const examples = ["Hepatocyte", "Breast cancer", "Alzheimer's disease"];

export default function Home() {
  return (
    <>
      <section className="narrow bg-theme-light relative z-0 overflow-hidden py-20! text-center">
        <Rings className="absolute top-1/2 left-1/2 -z-10 w-full max-w-200 -translate-x-1/2 -translate-y-1/2 text-[hsl(220,50%,50%,0.25)]" />

        <hgroup className="flex flex-col items-center gap-y-1">
          <h1 className="sr-only">Home</h1>

          <p className="text-xl font-normal tracking-wide text-balance">
            Discover Human Transcriptomics Data
          </p>

          <p className="text-balance">
            Search millions of annotated samples across major databases
          </p>
        </hgroup>

        <SearchBox />

        {/* examples */}
        <p className="flex flex-wrap items-center justify-center gap-4 leading-none">
          <span className="flex items-center gap-1 text-slate-500">
            <Lightbulb />
            Try
          </span>
          {examples.map((example) => (
            <Link key={example} to={`/search/${example}`}>
              {example}
            </Link>
          ))}
        </p>
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
}

export const SearchBox = () => {
  const navigate = useNavigate();

  /** search string state */
  const [search, setSearch] = useState("");

  /** update search from url */
  const params = useParams();
  useEffect(() => {
    if (params.search) setSearch(params.search);
  }, [params.search]);

  /** model search results */
  const query = useQuery({
    queryKey: ["model-search", search],
    queryFn: () => modelSearch(search),
  });

  /** search results */
  const results: (Model & { icon?: ReactNode })[] = search.trim()
    ? (query.data ?? [])
    : getHistory().map((search) => ({
        ...search,
        icon: <History className="text-slate-400" />,
      }));

  return (
    <Autocomplete
      search={search}
      setSearch={setSearch}
      placeholder="Search..."
      options={
        results.map(({ id, name, description, type, icon }) => ({
          value: id,
          content: (
            <>
              {icon}
              <span
                className={clsx(
                  "rounded px-1 py-0.5 text-sm leading-none text-white",
                  typeColor[type] ?? typeColor["default"],
                )}
              >
                {type}
              </span>
              <span
                className="truncate leading-none font-normal"
                dangerouslySetInnerHTML={{ __html: name }}
              />
              <span
                className="truncate leading-none text-slate-500"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </>
          ),
        })) ?? []
      }
      onSelect={(id) => {
        if (!id?.trim()) return;
        const model = query.data?.find((model) => model.id === id);
        if (model) addSearch(model);
        navigate(`/search/${id}`);
      }}
      status={
        showStatus({ query }) && <Status query={query} className="contents!" />
      }
      className="bg-white"
    />
  );
};
