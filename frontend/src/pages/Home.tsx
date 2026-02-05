import type { RefObject } from "react";
import type { Ontologies } from "@/api/types";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDebounce } from "@reactuses/core";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import {
  BookCheck,
  History,
  Lightbulb,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { ontologySearch, typeColor } from "@/api/api";
import Autocomplete from "@/components/Autocomplete";
import Button from "@/components/Button";
import Heading from "@/components/Heading";
import Rings from "@/components/Rings";
import Status, { showStatus } from "@/components/Status";
import { feedbackAtom } from "@/state/feedback";
import { addSearch, getHistory, searchHistoryAtom } from "@/state/search";
import { useChanged } from "@/util/hooks";

/** example searches */
const examples: Ontologies = [
  {
    id: "Hepatocyte",
    name: "Hepatocyte",
    type: "",
    description: "",
    series: "",
  },
  {
    id: "Breast cancer",
    name: "Breast cancer",
    type: "",
    description: "",
    series: "",
  },
  {
    id: "Alzheimer's disease",
    name: "Alzheimer's disease",
    type: "",
    description: "",
    series: "",
  },
];

export default function Home() {
  return (
    <>
      <section
        className="
          relative z-0 overflow-hidden bg-theme-light py-20! text-center narrow
        "
      >
        <Rings />

        <hgroup className="flex flex-col items-center gap-y-1 narrow">
          <h1 className="sr-only">Home</h1>

          <p className="text-xl font-normal tracking-wide text-balance">
            Discover Human Transcriptomics Data
          </p>

          <p className="text-balance">
            Search millions of annotated samples across major databases
          </p>
        </hgroup>

        <SearchBox />
      </section>

      <Stats />

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

export const SearchBox = ({
  inputRef,
  className,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}) => {
  const navigate = useNavigate();

  /** search string state (immediate) */
  const [_search, setSearch] = useState("");

  /** search (debounced) */
  const search = useDebounce(_search, 300);

  /** update search from url */
  const params = useParams();
  const searchChanged = useChanged(params.search);
  if (searchChanged && params.search) setSearch(params.search);

  /** ontology search results */
  const query = useQuery({
    queryKey: ["ontology-search", search],
    queryFn: () => ontologySearch(search),
  });

  /** search results */
  const results = search.trim()
    ? /** actual search results */
      (query.data?.map((result) => ({
        ...result,
        icon: <></>,
      })) ?? [])
    : /** if nothing typed in search box... */
      /** show search history */
      [
        ...getHistory()
          .list.slice(0, 10)
          .map(({ search }) => ({
            ...search,
            icon: <History className="text-slate-400" />,
          })),
        ...examples.map((example) => ({
          ...example,
          icon: <Lightbulb className="text-slate-400" />,
        })),
      ];

  return (
    <Autocomplete
      inputRef={inputRef}
      search={_search}
      setSearch={setSearch}
      placeholder="Search..."
      options={
        results.map(({ id, name, type, icon }) => ({
          value: id,
          content: (
            <>
              {icon}
              {type && (
                <span
                  className={clsx(
                    "rounded px-1 text-sm  text-white",
                    typeColor[type] ?? typeColor["default"],
                  )}
                >
                  {type}
                </span>
              )}
              {name && (
                <span
                  className="grow truncate font-normal"
                  dangerouslySetInnerHTML={{ __html: name }}
                />
              )}
              {id && <span className="text-right text-slate-500">{id}</span>}
            </>
          ),
        })) ?? []
      }
      onSelect={(id) => {
        if (!id?.trim()) return;
        const result = query.data?.find((result) => result.id === id);
        if (result) addSearch(result);
        navigate(`/search/${result?.id ?? ""}?raw=${_search}`);
      }}
      status={
        showStatus({ query }) && <Status query={query} className="contents!" />
      }
      className={className}
    />
  );
};

/** user's app stats */
const Stats = () => {
  const history = getHistory(useAtomValue(searchHistoryAtom));
  const feedback = useAtomValue(feedbackAtom);

  const uniqueSearches = Object.keys(history.grouped).length.toLocaleString();
  const studyFeedbacks = Object.keys(feedback).length.toLocaleString();

  const stats = [
    {
      Icon: ScanSearch,
      value: uniqueSearches,
      label: (
        <>
          Made <b>{uniqueSearches}</b> unique searches
        </>
      ),
      color: "text-yellow-500",
    },
    {
      Icon: BookCheck,
      value: studyFeedbacks,
      label: (
        <>
          Provided feedback on <b>{studyFeedbacks}</b> studies
        </>
      ),
      color: "text-emerald-500",
    },
  ];

  return (
    <section>
      <Heading level={2}>Your Stats</Heading>

      <em className="self-center">On this device, you've...</em>

      <div
        className="
          grid grid-cols-[repeat(auto-fit,minmax(0,auto))] justify-center gap-4
        "
      >
        {stats.map(({ Icon, value, label, color }, index) => (
          <div key={index} className="flex w-40 flex-col items-center gap-4">
            <div
              className={clsx(
                `
                  flex aspect-square w-1/2 items-center justify-center gap-2
                  rounded-full bg-current/10 text-2xl
                `,
                color,
              )}
            >
              <Icon />
              <span className="text-black">{value}</span>
            </div>
            <div className="text-center text-balance">{label}</div>
          </div>
        ))}
      </div>

      <Button
        className="self-center"
        color="accent"
        onClick={() => {
          if (
            window.confirm(
              `Clear all ${import.meta.env.VITE_TITLE} info saved on this device? No undo.
              
(Does not affect info already sent to us, such as previously submitted feedback.)`,
            )
          ) {
            window.localStorage.clear();
            window.location.reload();
          }
        }}
      >
        <Trash2 />
        Clear
      </Button>
    </section>
  );
};
