import analytics from "react-ga4";
import { BlobWriter, ZipWriter } from "@zip.js/zip.js/lib/zip-core-custom.js";
import { groupBy } from "lodash";
import { downloadBlob } from "@/util/download";

/** get static url of study */
export const getStudyDownload = (id: string, species: string) => {
  /** map our species name to recount */
  species = { "Homo sapiens": "human", "Mus musculus": "mouse" }[species] ?? "";
  if (!species) return "";
  /** sub-folder */
  const subfolder = id.slice(-2);
  /** file "extension" */
  const extension = { human: "G029", mouse: "M023" }[species];
  if (!extension) return "";
  /** full url of study on public recount bucket */
  return `https://recoun-opendata.s3.amazonaws.com/recount3/release/${species}/data_sources/sra/gene_sums/${subfolder}/${id}/sra.gene_sums.${id}.${extension}.gz`;
};

/** trigger download of list of studies */
export const downloadStudies = async (
  studies: { id: string; species: string }[],
  filename: string,
) => {
  analytics.event("recount_download_studies", { studies });

  /** errors to throw at end */
  const errors: { id: string; species: string }[] = [];

  /** archive blobs to download */
  const archives: { blob: Blob; filename: string }[] = [];

  /** group downloads by species */
  const grouped = groupBy(studies, (s) => s.species);

  for (const [species, studies] of Object.entries(grouped)) {
    const writer = new ZipWriter(new BlobWriter("application/zip"));
    let filesAdded = false;

    for (const { id } of studies) {
      /** get study download url */
      const url = getStudyDownload(id, species);
      try {
        /** check url */
        if (!url) throw Error("Invalid URL");
        /** get filename from url */
        const filename = new URL(url).pathname.split("/").pop();
        if (!filename) throw Error("No filename");
        /** download file */
        const response = await window.fetch(url);
        if (!response.ok) throw Error("Response not OK");
        if (!response.body) throw Error("Response empty");
        /** add file to archive */
        await writer.add(filename, response.body);
        filesAdded = true;
      } catch (error) {
        console.warn(error);
        /** mark as error */
        errors.push({ id, species });
      }
    }

    /** don't make archive if no files added */
    if (filesAdded)
      /** make archive */
      archives.push({
        blob: await writer.close(),
        filename: `${filename}-${species}`,
      });
  }

  /** download all archives, after assembly finished, before errors */
  for (const { blob, filename } of archives)
    downloadBlob(blob, filename, ".zip");

  /** throw errors if any */
  if (errors.length)
    throw new Error(
      `Failed to download studies: ${errors.map(({ id, species }) => `${id} (${species})`).join(", ")}`,
    );

  /** return successes */
  return archives.map(({ filename }) => filename);
};

/** return code to download recount studies manually */
export const getDownloadScript = (studies: { id: string }[]) =>
  `
if (!requireNamespace("BiocManager", quietly = TRUE)) {
    install.packages("BiocManager")
}

BiocManager::install("recount3")

library(recount3)

cache_dir <- recount3_cache()

studies <- c(${studies.map((study) => `"${study.id}"`).join(", ")})
for (study in studies) {
    url <- locate_url(
        study,
        "data_sources/sra",
        type="gene",
    )
    data = file_retrieve(
        url=url, bfc=cache_dir
    )
}
`.trim();
