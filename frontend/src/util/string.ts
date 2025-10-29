/** shorten url text */
export const shortenUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (url.hostname + url.pathname).replace(/\/+$/, "");
  } catch (error) {
    return value;
  }
};

/** make string url-safe */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replaceAll(" ", "-");

/** format number to string */
export const formatNumber = (value: number | undefined, compact = false) => {
  if (value === undefined) return "-";
  if (Math.abs(value) < 0.01 && value) return value.toExponential(1);
  const options: Intl.NumberFormatOptions = {};
  if (compact) options.notation = "compact";
  options.maximumSignificantDigits = compact ? 2 : 4;
  return value.toLocaleString(undefined, options).toLowerCase();
};

/** parse date string with fallback */
export const parseDate = (date: string | Date | undefined) => {
  if (!date) return null;
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) throw Error("");
    return new Date(date);
  } catch (error) {
    return null;
  }
};

/** format date to string */
export const formatDate = (
  date: string | Date | undefined,
  compact = false,
) => {
  const parsed = parseDate(date);
  if (parsed)
    return compact
      ? parsed.getFullYear()
      : parsed.toLocaleString(undefined, { dateStyle: "medium" });
  return "";
};
