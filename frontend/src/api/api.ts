import type { Feedback } from "@/api/types";
import type { ShareCart } from "@/state/cart";
import analytics from "react-ga4";
import z from "zod";
import { api, request } from "@/api";
import { cart, ontologies, samples, stats, studies } from "@/api/types";
import { downloadBlob } from "@/util/download";

/** get project wide stats */
export const getStats = async () => {
  const url = new URL(`${api}/stats/`);
  const data = await request(url, stats);
  return data;
};

/** search for ontologies */
export const ontologySearch = async (search: string) => {
  const url = new URL(`${api}/ontology/search/`);
  url.searchParams.set("query", search);
  analytics.event("ontology_search", { search });
  const data = await request(url, ontologies);
  return data;
};

/** search for studies and get full details */
export const studySearch = async ({
  search = "",
  ordering = "",
  offset = 0,
  limit = 100,
  facets = {} as Record<string, string[]>,
}) => {
  const url = new URL(`${api}/study/search/`);
  url.searchParams.set("query", search);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  for (const [facet, values] of Object.entries(facets))
    for (const value of values) url.searchParams.append(facet, value);
  analytics.event("study_search", { search, ordering, facets });
  const data = await request(url, studies);
  return data;
};

/** batch lookup full study details by ids */
export const studyBatchLookup = async ({
  ids = [] as string[],
  ordering = "",
  offset = 0,
  limit = 100,
}) => {
  const url = new URL(`${api}/study/lookup/`);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ids },
  };
  analytics.event("study_batch_lookup", { ids });
  const data = await request(url, studies, options);
  return data;
};

/** lookup all samples for a study */
export const studySamples = async ({
  id = "",
  search = "",
  ordering = "",
  offset = 0,
  limit = 10,
}) => {
  const url = new URL(`${api}/study/${id}/samples/`);
  url.searchParams.set("query", search);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const data = await request(url, samples);
  analytics.event("study_samples", { id });
  return data;
};

/** submit study feedback */
export const studyFeedback = async (
  id: string,
  user: { name: string; email: string },
  /** allow undefined to clear/unset feedback */
  feedback: Feedback | undefined,
) => {
  const url = new URL(`${api}/study/feedback/`);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { id, user, ...feedback },
  } as const;
  analytics.event("study_feedback", { id, ...feedback });
  const data = await request(url, z.unknown(), options);
  return data;
};

/** lookup a cart by id */
export const cartLookup = async (id: string) => {
  const url = new URL(`${api}/cart/${id}/`);
  analytics.event("cart_lookup", { id });
  const data = await request(url, cart);
  return data;
};

/** share cart */
export const shareCart = async (shareCart: ShareCart) => {
  const url = new URL(`${api}/cart/`);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: shareCart,
  };
  analytics.event("share_cart", shareCart);
  const data = await request(url, cart, options);
  return data;
};

/** download cart data */
export const downloadCart = async (
  ids: string[],
  filename: string,
  type: string,
) => {
  const url = new URL(`${api}/cart/download/`);
  url.searchParams.set("type", type);
  url.searchParams.set("filename", filename);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ids },
    parse: "blob",
  } as const;
  analytics.event("download_cart", { ids, filename, type });
  const data = await request(url, z.instanceof(Blob), options);
  if (type === "csv") downloadBlob(data, filename, "csv");
  if (type === "json") downloadBlob(data, filename, "json");
};
