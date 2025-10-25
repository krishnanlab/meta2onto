import Tooltip from "@/components/Tooltip";

const databases = [
  {
    name: "Refine.bio",
    description: "Normalized, analysis-ready data with harmonized annotations",
    good: "Best for meta-analysis",
  },
  {
    name: "ARCHS4",
    description:
      "Pre-processed gene expression matrices with consistent pipeline",
    good: "Good for large-scale analysis",
  },
  {
    name: "Recount3",
    description: "Raw counts with flexible normalization options",
    good: "For custom processing",
  },
  {
    name: "GEO",
    description: "Original raw data and author-processed files",
    good: "Most comprehensive metadata",
  },
  {
    name: "SRA",
    description: "Raw sequencing reads (FASTQ files)",
    good: "For custom alignment",
  },
  {
    name: "BioStudies",
    description: "Supplementary files and additional study resources",
    good: "Complete study context",
  },
] as const;

type Props = {
  /** database name */
  database: string;
  /** where to show full details */
  full?: boolean;
};

/** pill for database info */
const Database = ({ database, full = false }: Props) => {
  const {
    name = "",
    description = "",
    good = "",
  } = databases.find((db) => db.name === database) ?? {};

  if (full)
    return (
      <div className="border-theme-light flex w-40 flex-col items-start gap-2 rounded border-1 p-2">
        <div key={database} className="bg-theme-light rounded px-1">
          {name}
        </div>
        <div className="text-balance text-slate-500">{description}</div>
        <div className="text-balance">{good}</div>
      </div>
    );

  return (
    <Tooltip
      content={
        <>
          <strong className="">{name}</strong>
          <div className="text-balance">{description}</div>
          <div className="text-balance">{good}</div>
        </>
      }
    >
      <div key={database} className="bg-theme-light rounded px-1">
        {name}
      </div>
    </Tooltip>
  );
};

export default Database;
