import Tooltip from "@/components/Tooltip";

export const databases = [
  {
    id: "Refine.bio",
    description: "Normalized, analysis-ready data with harmonized annotations",
    good: "Best for meta-analysis",
  },
  {
    id: "ARCHS4",
    description:
      "Pre-processed gene expression matrices with consistent pipeline",
    good: "Good for large-scale analysis",
  },
  {
    id: "Recount3",
    description: "Raw counts with flexible normalization options",
    good: "For custom processing",
  },
  {
    id: "GEO",
    description: "Original raw data and author-processed files",
    good: "Most comprehensive metadata",
  },
  {
    id: "SRA",
    description: "Raw sequencing reads (FASTQ files)",
    good: "For custom alignment",
  },
  {
    id: "BioStudies",
    description: "Supplementary files and additional study resources",
    good: "Complete study context",
  },
];

type Props = {
  /** database id */
  database: string;
  /** where to show full details */
  full?: boolean;
};

/** pill for database info */
export default function Component({ database, full = false }: Props) {
  const {
    id = "",
    description = "",
    good = "",
  } = databases.find((db) => db.id === database) ?? {};

  const details = (
    <div className="flex flex-col items-start gap-2">
      <div key={database} className="bg-theme-light rounded px-1 text-black">
        {id}
      </div>
      <div className="text-balance">{description}</div>
      <div className="text-balance italic opacity-75">{good}</div>
    </div>
  );

  if (full) return details;

  return (
    <Tooltip content={details}>
      <div key={database} className="bg-theme-light rounded px-1 text-black">
        {id}
      </div>
    </Tooltip>
  );
}
