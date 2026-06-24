/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-pink-500/25",
  disease: "bg-emerald-500/25",
  celltype: "bg-sky-500/25",
  default: "bg-stone-500/25",
};

/** performance to color map */
export const performanceColor: Record<string, string> = {
  high: "bg-emerald-500/25",
  medium: "bg-orange-500/25",
  low: "bg-rose-500/25",
  default: "bg-stone-500/25",
};

/** performance to tooltip map */
export const performanceTooltip: Record<string, string> = {
  high: "Known positive studies were consistently ranked near the top.",
  medium:
    "Known positive studies were generally ranked highly, with some exceptions.",
  low: "Known positive studies were not reliably ranked highly.",
  default:
    "Not enough ground-truth positive studies were available to rigorously evaluate this term.",
};

export const databaseTooltip: Record<string, string> = {
  "Refine.bio":
    "A multi-species compendium of genome-wide RNA-Seq and microarray gene expression data",
  ARCHS4:
    "A compendium of uniformly processed RNA-seq and Chip-Seq data from human and mouse",
  Recount3:
    "A uniformly processed compendium of RNA-seq gene, exon, and exon-exon junction counts from human and mouse",
  SRA: "An NCBI collection of public high-throughput sequencing data",
  BioProject:
    "An NCBI collection of datasets related to a single initiative or large consortium",
  BioSample:
    "An NCBI collection of metadata of biological materials used in experimental assays",
} as const;

export const databaseLink: Record<string, string> = {
  "Refine.bio": "https://www.refine.bio/search[?search=$STUDY]",
  ARCHS4: "https://archs4.org",
  Recount3: "https://jhubiostatistics.shinyapps.io/recount3-study-explorer",
  SRA: "https://www.ncbi.nlm.nih.gov/sra[?term=$STUDY]",
  BioProject: "https://www.ncbi.nlm.nih.gov/bioproject[?term=$STUDY]",
  BioSample: "https://www.ncbi.nlm.nih.gov/biosample[?term=$STUDY]",
} as const;
