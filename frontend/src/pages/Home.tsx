import type { FunctionComponent, ReactNode, RefObject } from "react";
import type { Ontologies } from "@/api/types";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDebounce } from "@reactuses/core";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { omit } from "lodash";
import {
  ArrowLeftRight,
  Brain,
  Glasses,
  HeartPulse,
  History,
  Lightbulb,
  Microscope,
  MoveDown,
  MoveRight,
  Pipette,
  Rat,
  Recycle,
  RotateCcw,
  SearchCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { getStats, ontologySearch } from "@/api/api";
import { performanceColor, typeColor } from "@/api/maps";
import Autocomplete from "@/components/Autocomplete";
import { H2 } from "@/components/Heading";
import Pill from "@/components/Pill";
import Rings from "@/components/Rings";
import Status, { showStatus } from "@/components/Status";
import { Highlight } from "@/pages/Studies";
import { addSearch, getHistory } from "@/state/search";
import { useChanged } from "@/util/hooks";
import { formatNumber } from "@/util/string";

/** example searches */
const examples: Ontologies = [
  {
    id: "CL:0000182",
    name: "Hepatocyte",
    type: "celltype",
    description: "",
    series: "",
    performance: "",
  },
  {
    id: "MONDO:0007254",
    name: "Breast cancer",
    type: "disease",
    description: "",
    series: "",
    performance: "",
  },
  {
    id: "MONDO:0004975",
    name: "Alzheimer's disease",
    type: "disease",
    description: "",
    series: "",
    performance: "",
  },
];

export default function Home() {
  /** get project stats */
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <>
      <section className="relative isolate overflow-hidden bg-theme-light py-20! text-center width-sm">
        <Rings />

        <hgroup className="flex flex-col items-center gap-y-1 width-sm">
          <h1 className="sr-only">Home</h1>

          <p className="text-2xl font-medium tracking-wide text-balance">
            Discover, Collect, Reuse
          </p>

          <p className="text-balance">
            Interpretable & standardized tissue and disease annotations for
            hundreds of thousands of Gene Expression Omnibus (GEO) studies
          </p>
        </hgroup>

        <SearchBox />
      </section>

      <section>
        <H2 className="sr-only">How it works</H2>

        <div className="flex justify-center gap-8 max-md:flex-col [&>svg]:size-8 [&>svg]:self-center [&>svg]:text-stone-300">
          <Tile
            big
            className="text-accent"
            Icon={SearchCheck}
            title="Discover"
            description="Search for tissue or disease term you're interested in"
          />
          <MoveRight className="max-md:hidden" />
          <MoveDown className="md:hidden" />
          <Tile
            big
            className="text-accent"
            Icon={ShoppingCart}
            title="Collect"
            description={
              <>
                Add relevant studies to your cart, filter by <i>refine.bio</i>,{" "}
                <i>ARCHS4</i>, and more
              </>
            }
          />
          <MoveRight className="max-md:hidden" />
          <MoveDown className="md:hidden" />
          <Tile
            big
            className="text-accent"
            Icon={Recycle}
            title="Reuse"
            description={
              <>
                Download your cart, export to <i>refine.bio</i>, or share
              </>
            }
          />
        </div>
      </section>

      <section>
        <H2 className="sr-only">Features</H2>

        <div className="grid grid-cols-3 gap-8 self-center max-md:grid-cols-2 max-sm:grid-cols-1">
          <Tile
            big
            className="text-theme"
            Icon={Glasses}
            title="Interpretable"
            description={
              <>
                We <Highlight keywords={["", "highlight"]}>highlight</Highlight>{" "}
                words that contribute to each prediction, making it easy to
                understand why they were made
              </>
            }
          />
          <Tile
            big
            className="text-theme"
            Icon={RotateCcw}
            title="Up-to-date"
            description="We update our predictions semi-annually so results reflect the latest studies available on GEO"
          />
          <Tile
            big
            className="text-theme"
            Icon={ArrowLeftRight}
            title="Standardized"
            description="We standardize annotations to biomedical ontologies, ensuring consistency and interoperability across studies"
          />
        </div>
      </section>

      <section>
        <H2 className="sr-only">Stats</H2>

        <div className="grid grid-cols-6 gap-8 self-center max-lg:grid-cols-3 max-md:grid-cols-3 max-sm:grid-cols-2">
          <Tile
            Icon={Brain}
            title={formatNumber(stats?.tissues)}
            description="tissues"
          />
          <Tile
            Icon={HeartPulse}
            title={formatNumber(stats?.diseases)}
            description="diseases"
          />
          <Tile
            Icon={Microscope}
            title={formatNumber(stats?.studies)}
            description="studies"
          />
          <Tile
            Icon={Pipette}
            title={formatNumber(stats?.samples)}
            description="samples"
          />
          <Tile
            Icon={Rat}
            title={formatNumber(stats?.species)}
            description="species"
          />
          <Tile
            Icon={Wrench}
            title={formatNumber(stats?.technologies)}
            description="technologies"
          />
          {/* re-enable when we have more to brag about */}
          {/* <Tile
            Icon={ThumbsUp}
            title={formatNumber(stats?.feedback)}
            description="user feedback"
          /> */}
        </div>
      </section>
    </>
  );
}

type SearchBoxProps = {
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
};

export function SearchBox({ inputRef, className }: SearchBoxProps) {
  const navigate = useNavigate();

  /** search string state (immediate) */
  const [_search, setSearch] = useState("");

  /** search (debounced) */
  const search = useDebounce(_search, 300);

  /** update search from url */
  const [params] = useSearchParams();
  const raw = params.get("raw") ?? "";
  const searchChanged = useChanged(raw);
  if (searchChanged && raw) setSearch(raw);

  /** ontology search results */
  const ontologySearchQuery = useQuery({
    queryKey: ["ontologySearch", search],
    queryFn: () => ontologySearch(search),
  });

  /** search results */
  const results = search.trim()
    ? /** actual search results */
      (ontologySearchQuery.data?.map((result) => ({
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
            icon: <History className="text-stone-400" />,
          })),
        ...examples.map((example) => ({
          ...example,
          icon: <Lightbulb className="text-stone-400" />,
        })),
      ];

  return (
    <Autocomplete
      inputRef={inputRef}
      search={_search}
      setSearch={setSearch}
      placeholder="Search..."
      options={
        results.map(({ id, name, type, icon, performance }) => ({
          value: id,
          content: (
            <>
              {icon}
              {type && <Pill value={type} color={typeColor} className="w-20" />}
              {name && (
                <span
                  className="grow truncate font-regular"
                  dangerouslySetInnerHTML={{ __html: name }}
                />
              )}
              {id && <span className="text-stone-500">{id}</span>}
              {performance && (
                <Pill
                  value={performance}
                  color={performanceColor}
                  className="w-20"
                />
              )}
            </>
          ),
        })) ?? []
      }
      onSelect={(id) => {
        if (!id?.trim()) return;
        const result = results.find((result) => result.id === id);
        if (!result) return;
        addSearch(omit(result, "icon"));
        const params = new URLSearchParams();
        params.set("raw", search || result.name);
        navigate(`/studies/${id}?${params.toString()}`);
      }}
      status={
        search.trim() &&
        showStatus({ query: ontologySearchQuery }) && (
          <Status query={ontologySearchQuery} className="contents!" />
        )
      }
      className={className}
    />
  );
}

type TileProps = {
  big?: boolean;
  className?: string;
  Icon: FunctionComponent<{ className?: string }>;
  title: ReactNode;
  description: ReactNode;
};

function Tile({
  big = false,
  className = "text-stone-500",
  Icon,
  title,
  description,
}: TileProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center",
        big ? "gap-4" : "gap-0",
        className,
      )}
    >
      <div
        className={clsx(
          "mb-2 grid place-items-center rounded-full",
          big ? "size-16 bg-current/10" : "size-12 border-2 border-current/10",
        )}
      >
        <Icon className="size-1/2" />
      </div>
      <div className="flex items-center gap-2 text-xl font-medium">{title}</div>
      <p className="text-center text-balance text-stone-700">{description}</p>
    </div>
  );
}
