import analytics from "react-ga4";
import { groupBy } from "lodash";
import {
  downloadFile,
  downloadFileAs,
  downloadFilesAs,
  downloadZip,
} from "@/util/download";

/** map of our species names to recount */
const speciesMap: Record<string, string> = {
  "Homo sapiens": "human",
  "Mus musculus": "mouse",
};

/** get static url of study */
export const getStudyDownload = (id: string, species: string) => {
  /** map our species name to recount */
  species = speciesMap[species] ?? "";
  if (!species) return "";
  /** sub-folder */
  const subfolder = id.slice(-2);
  /** file "extension" */
  const extension = { human: "G026", mouse: "M023" }[species];
  if (!extension) return "";
  /** full url of study on public recount bucket */
  return `https://recount-opendata.s3.amazonaws.com/recount3/release/${species}/data_sources/sra/gene_sums/${subfolder}/${id}/sra.gene_sums.${id}.${extension}.gz`;
};

/** trigger download of list of studies */
export const downloadStudies = async (
  studies: { id: string; species: string }[],
  filename: string,
  zip: boolean,
) => {
  analytics.event("recount_download_studies", { studies, zip });

  /** download each raw study file */
  const downloads = await Promise.allSettled(
    studies.map(async ({ id, species }) => {
      /** get study download url */
      const url = getStudyDownload(id, species);
      /** check url */
      if (!url) throw Error(`${id} Invalid URL`);
      /** get filename from url */
      const filename = new URL(url).pathname.split("/").pop();
      if (!filename) throw Error(`${id} No filename`);
      /** download file */
      const response = await window.fetch(url);
      if (!response.ok) throw Error(`${id} Response not OK`);
      if (!response.body) throw Error(`${id} Response empty`);
      return { id, species, url, filename, response };
    }),
  );

  /** separate successful and failed downloads */
  const successes = downloads
    .filter((settled) => settled.status === "fulfilled")
    .map((settled) => settled.value);
  const errors = downloads
    .filter((settled) => settled.status === "rejected")
    .map((settled) => settled.reason);

  if (zip) {
    /** download zipped archive */
    const download = await downloadZip(
      successes.map(({ response, species, filename }) => ({
        response,
        path: `${species}/${filename}`,
      })),
      filename,
    );
    try {
      /** try with save-as-file picker */
      await downloadFileAs(download);
    } catch (error) {
      console.warn(error);
      /** fall back to typical download */
      downloadFile(download);
    }
  } else {
    /** download individual files */
    const downloads = await Promise.all(
      successes.map(async ({ response, species, filename }) => ({
        data: await response.clone().blob(),
        subfolder: species,
        filename,
      })),
    );
    try {
      /** try with save-to-directory picker */
      await downloadFilesAs(downloads);
    } catch (error) {
      console.warn(error);
      /** fall back to typical download */
      for (const download of downloads) downloadFile(download);
    }
  }

  /** throw errors if any */
  if (errors.length)
    throw new Error(
      `Failed to download studies: ${errors.map((reason) => reason?.message ?? "Unknown error").join(", ")}`,
    );

  /** return successes */
  return successes;
};

/** return code to download recount studies manually */
export const getDownloadScript = (
  studies: { id: string; species: string }[],
) => {
  /** main script body */
  let body = `
if (!requireNamespace("BiocManager", quietly = TRUE)) {
    install.packages("BiocManager")
}

BiocManager::install("recount3")

library(recount3)

cache_dir <- recount3_cache()
`;

  /** group studies by species */
  const grouped = groupBy(studies, (study) => study.species);

  /** for each species */
  for (const [species, studies] of Object.entries(grouped)) {
    /** nice species name */
    const name = speciesMap[species] ?? species;

    /** study ids */
    const ids = studies.map((study) => `"${study.id}"`).join(", ");

    /** add species-specific loop */
    body += `
studies_${name} <- c(${ids})
for (study in studies_${name}) {
  url <- locate_url(
    study,
    "data_sources/sra",
    type="gene",
    organism = "${name}"
  )
  data = file_retrieve(
    url=url, bfc=cache_dir
  )
}
`;
  }

  return body.trim();
};
