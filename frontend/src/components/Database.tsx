import Link from "@/components/Link";
import Tooltip from "@/components/Tooltip";

export const databases = [
  {
    id: "Refine.bio",
    description: "Normalized, analysis-ready data with harmonized annotations",
    good: "Best for meta-analysis",
    link: "https://www.refine.bio/v1/download/$ID.zip",
  },
  {
    id: "ARCHS4",
    description:
      "Pre-processed gene expression matrices with consistent pipeline",
    good: "Good for large-scale analysis",
    link: "https://maayanlab.cloud/archs4/download.html",
  },
  {
    id: "Recount3",
    description: "Raw counts with flexible normalization options",
    good: "For custom processing",
    link: "https://jhubiostatistics.shinyapps.io/recount3/",
  },
  {
    id: "GEO",
    description: "Original raw data and author-processed files",
    good: "Most comprehensive metadata",
    link: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=$ID",
  },
  {
    id: "SRA",
    description: "Raw sequencing reads (FASTQ files)",
    good: "For custom alignment",
    link: "https://www.ncbi.nlm.nih.gov/sra/$ID",
  },
  {
    id: "BioStudies",
    description: "Supplementary files and additional study resources",
    good: "Complete study context",
    link: "https://www.ebi.ac.uk/biostudies/studies/$ID",
  },
  {
    id: "BioProject",
    description: "Collection of biological data related to a single initiative",
    good: "Complete study context",
    link: "https://www.ncbi.nlm.nih.gov/bioproject/$ID",
  },
  {
    id: "ArrayExpress",
    description: "Functional genomics data collection",
    good: "Functional genomics focus",
    link: "https://www.ebi.ac.uk/arrayexpress/experiments/$ID",
  },
  {
    id: "Peptidome",
    description:
      "Integration of de novo sequencing, database search, and homology searchn",
    good: "Predict aspects of modified peptides",
    link: "https://www.ncbi.nlm.nih.gov/peptidome/$ID",
  },
] as const;

type Database = (typeof databases)[number];

/** lookup database from id */
export const getDb = (database: string): Partial<Database> =>
  databases.find((db) => db.id === database) ?? {};

/** get download link for study from db */
export const dbLink = (link?: string, study?: string) =>
  link?.replace("$ID", study ?? "") ?? "";

type Props = {
  /** study id */
  study?: string;
  /** database id */
  database: string;
  /** where to show full details */
  full?: boolean;
};

/** pill for database info */
export default function Database({
  study = "",
  database,
  full = false,
}: Props) {
  const { id = "", description = "", good = "", link = "" } = getDb(database);

  const details = (
    <div className="flex flex-col items-start gap-2">
      <div key={database} className="rounded-sm bg-theme-light px-1 text-black">
        {id}
      </div>
      <div className="text-balance">{description}</div>
      <div className="text-balance italic opacity-75">{good}</div>
    </div>
  );

  if (full) return details;

  return (
    <Tooltip content={details}>
      <Link
        key={database}
        to={dbLink(link, study)}
        tabIndex={0}
        className="rounded-sm bg-theme-light px-1 text-black"
      >
        {id}
      </Link>
    </Tooltip>
  );
}
