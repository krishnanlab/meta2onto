import type z from "zod";

/** base api url */
export const api = import.meta.env.VITE_API;

/** url parameters */
type Params = URLSearchParams;

/** parse response mode */
type Parse = "json" | "text" | "blob";

/** request body */
type Body = Record<string, unknown>;

type Options = Omit<RequestInit, "body"> & {
  params?: Params;
  body?: Body;
  parse?: Parse;
};

/** general request */
export async function request<Response>(
  /** request url */
  url: URL,
  /** schema validator */
  schema: z.ZodType<Response>,
  /** raw request options plus extra options */
  options: Options = {},
) {
  /** extract extra options */
  const { body, parse = "json", ...rest } = options;
  /** raw request options */
  const rawOptions: RequestInit = { ...rest };
  /** stringify body object */
  if (body) rawOptions.body = JSON.stringify(body);
  /** set headers */
  rawOptions.headers = new Headers(rawOptions.headers);
  /** include uuid in all requests */
  rawOptions.headers.set("x-user-uuid", uuid);
  /** construct request */
  const request = new Request(url, rawOptions);
  console.debug(`📞 Request ${url}`, { options, request });
  /** make request */
  const response = await fetch(request);
  /** capture error for throwing later */
  let error = "";
  /** check status code */
  if (!response.ok) error = `${response.status}: ${response.statusText}`;
  /** parse response */
  let parsed: Response | undefined;
  try {
    if (parse === "blob") parsed = (await response.clone().blob()) as Response;
    if (parse === "json") parsed = (await response.clone().json()) as Response;
    if (parse === "text") parsed = (await response.clone().text()) as Response;
  } catch (e) {
    error = `Couldn't parse response as ${parse}`;
  }
  /** validate response */
  try {
    schema.parse(parsed);
  } catch (e) {
    error = `Validation error: ${(e as z.ZodError).message}`;
  }
  console.debug(`📣 Response ${url}`, { parsed, response });
  /** throw error after details have been logged */
  if (error || parsed === undefined) throw Error(error);
  return parsed;
}

/** unique user identifier */
const uuid = window.localStorage.getItem("uuid") || window.crypto.randomUUID();
window.localStorage.setItem("uuid", uuid);
