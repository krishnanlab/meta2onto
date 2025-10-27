/** assemble and clean full filename */
export const getFilename = (filename: string) =>
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

/** make url from blob */
export const getUrl = (
  /** blob data to download */
  data: BlobPart,
  /** mime type */
  type: string,
) =>
  typeof data === "string" && data.startsWith("data:")
    ? data
    : window.URL.createObjectURL(new Blob([data], { type }));

/** download string as text file */
export const downloadTxt = (data: string, filename: string) =>
  download(getUrl(data, "text/plain;charset=utf-8"), filename, "txt");

/** download string as bash file */
export const downloadSh = (data: string, filename: string) =>
  download(getUrl(data, "text/x-shellscript;charset=utf-8"), filename, "sh");
