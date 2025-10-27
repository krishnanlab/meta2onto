/** base api url */
export const api = import.meta.env.VITE_API;

/** url parameters */
type Params = URLSearchParams;

/** parse response mode */
type Parse = "json" | "text";

/** request body */
type Body = Record<string, unknown>;

type CombinedOptions = Omit<RequestInit, "body"> & {
  params?: Params;
  body?: Body;
  parse?: Parse;
};

/** general request */
export async function request<Response>(
  /** request url */
  url: string | URL,
  /** raw request options plus extra options */
  combinedOptions: CombinedOptions = {},
) {
  /** extract extra options */
  const { params = {}, body, parse = "json", ...rest } = combinedOptions;
  /** raw request options */
  const options: RequestInit = { ...rest };
  /** make url object */
  url = new URL(url);
  /** set url params */
  url.search = params.toString();
  /** stringify body object */
  if (body) options.body = JSON.stringify(body);
  /** construct request */
  const request = new Request(url, options);
  console.debug(`📞 Request ${url}`, { combinedOptions, request });
  /** make request */
  const response = await fetch(request);
  /** capture error for throwing later */
  let error = "";
  /** check status code */
  if (!response.ok) error = "Response not OK";
  /** parse response */
  let parsed: Response | undefined;
  try {
    parsed =
      parse === "text"
        ? await response.clone().text()
        : await response.clone().json();
  } catch (e) {
    error = `Couldn't parse response as ${parse}`;
  }
  console.debug(`📣 Response ${url}`, { parsed, response });
  /** throw error after details have been logged */
  if (error || parsed === undefined) throw Error(error);
  return parsed;
}
