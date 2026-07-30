/** assemble and clean full filename */
const getFilename = (filename: string) =>
  filename
    /** make path safe */
    .replace(/[^A-Za-z0-9]+/g, "-")
    /** remove leading/trailing dashes */
    .replace(/(^-+)|(-+$)/g, "");

/** download url as file */
const download = (
  /** url to download */
  url: string,
  /** single filename string or filename "parts" */
  filename: string,
  /** extension, without dot */
  ext: string,
) => {
  let download = getFilename(filename);

  /** add extension */
  if (!download.endsWith("." + ext)) download += "." + ext;

  /** trigger download */
  const link = document.createElement("a");
  link.href = url;
  link.download = download;
  link.click();
  window.URL.revokeObjectURL(url);
};

/** make url from data */
const getUrl = (
  /** data to download */
  data: string | BlobPart | Blob,
  /** mime type */
  type?: string,
) =>
  typeof data === "string" && data.startsWith("data:")
    ? data
    : window.URL.createObjectURL(
        data instanceof Blob ? data : new Blob([data], { type }),
      );

/** download data as json file */
export const downloadJson = (data: unknown, filename: string) =>
  download(
    getUrl(JSON.stringify(data, null, 2), "application/json;charset=utf-8"),
    filename,
    "json",
  );

type Table = (string | number | boolean | null | undefined)[][];

/** assemble csv/tsv from arrays */
const stringifyTable = (table: Table, delimiter = "\t") =>
  table
    .map((row) =>
      row
        .map((col) => (col === null || col === undefined ? "" : String(col)))
        .join(delimiter),
    )
    .join("\n");

/** download data as csv file */
export const downloadCsv = (data: Table, filename: string) =>
  download(
    getUrl(stringifyTable(data, ","), "text/csv;charset=utf-8"),
    filename,
    "csv",
  );

/** download data as tsv file */
export const downloadTsv = (data: Table, filename: string) =>
  download(
    getUrl(
      stringifyTable(data, "\t"),
      "text/tab-separated-values;charset=utf-8",
    ),
    filename,
    "tsv",
  );
