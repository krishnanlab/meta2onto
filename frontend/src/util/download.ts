import { BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { BYTE_ORDER_MARK, unparse } from "papaparse";

type Extension = `.${string}`;
type MimeType = `${string}/${string}`;
type Download = {
  data: BlobPart;
  subfolder?: string;
  filename: string;
  ext?: Extension;
  mimeType?: MimeType;
};

/** clean filename */
const cleanFilename = (filename: string) =>
  filename
    /** make path safe */
    .replace(/[^A-Za-z0-9]+/g, "-")
    /** remove leading/trailing dashes */
    .replace(/(^-+)|(-+$)/g, "");

/** download data as json file */
export const downloadJson = (data: unknown, filename: string): Download => ({
  data: JSON.stringify(data, null, 2),
  filename,
  ext: ".json",
  mimeType: "application/json",
});

type Tabular = (string | number | boolean | null | undefined)[][];

/** assemble csv/tsv from arrays */
const stringifyTable = (table: Tabular, delimiter = "\t") =>
  BYTE_ORDER_MARK + unparse(table, { delimiter });

/** download data as csv file */
export const downloadCsv = (data: Tabular, filename: string): Download => ({
  data: stringifyTable(data, ","),
  filename,
  ext: ".csv",
  mimeType: "text/csv",
});

/** download data as tsv file */
export const downloadTsv = (data: Tabular, filename: string): Download => ({
  data: stringifyTable(data, "\t"),
  filename,
  ext: ".tsv",
  mimeType: "text/tab-separated-values",
});

/** download file */
export const downloadFile = ({ data, filename, ext, mimeType }: Download) => {
  filename = cleanFilename(filename);
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}${ext ?? ""}`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/** download file as */
export const downloadFileAs = async ({
  data,
  filename,
  ext,
  mimeType,
}: Download) => {
  filename = cleanFilename(filename);
  try {
    /** get user-picked file */
    const handle = await window.showSaveFilePicker({
      suggestedName: `${filename}${ext ?? ""}`,
      types:
        ext && mimeType
          ? [{ description: mimeType, accept: { [mimeType]: [ext] } }]
          : undefined,
    });
    /** create file */
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (error) {
    if (canceled(error)) console.info("User cancelled picker");
    else throw error;
  }
};

/** download multiple files as */
export const downloadFilesAs = async (downloads: Download[]) => {
  try {
    /** get user-picked folder */
    const directory = await window.showDirectoryPicker({ mode: "readwrite" });
    for (let { data, subfolder, filename, ext = "" } of downloads) {
      /** create sub-folder within picked folder */
      let subdirectory = directory;
      if (subfolder)
        subdirectory = await directory.getDirectoryHandle(
          cleanFilename(subfolder),
          { create: true },
        );
      /** create file in sub-folder */
      filename = cleanFilename(filename);
      const fileHandle = await subdirectory.getFileHandle(
        `${filename}${ext ?? ""}`,
        {
          create: true,
        },
      );
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
    }
  } catch (error) {
    if (canceled(error)) console.info("User cancelled picker");
    else throw error;
  }
};

/** whether error is user cancelling a picker */
const canceled = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

/** download multiple fetch responses as zip */
export const downloadZip = async (
  responses: { response: Response; path: string }[],
  filename: string,
): Promise<Download> => {
  filename = cleanFilename(filename);
  const writer = new ZipWriter(new BlobWriter("application/zip"));
  for (const { response, path } of responses)
    await writer.add(path, response.body);
  const blob = await writer.close();
  return { data: blob, filename, ext: ".zip", mimeType: "application/zip" };
};
