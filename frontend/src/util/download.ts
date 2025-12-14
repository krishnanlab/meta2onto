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

/** download blob as file */
export const downloadBlob = (data: Blob, filename: string, ext: string) =>
  download(getUrl(data), filename, ext);

/** download string as text file */
export const downloadTxt = (data: string, filename: string) =>
  download(getUrl(data, "text/plain;charset=utf-8"), filename, "txt");

/** download string as bash file */
export const downloadSh = (data: string, filename: string) =>
  download(getUrl(data, "text/x-shellscript;charset=utf-8"), filename, "sh");
