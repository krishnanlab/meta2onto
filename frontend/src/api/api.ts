import type { Cart, Feedback } from "@/api/types";
import type { LocalCart, ShareCart } from "@/state/cart";
import z from "zod";
import { api, request } from "@/api";
import { cart, ontologies, samples, studies } from "@/api/types";
import { dbLink, getDb } from "@/components/Database";
import { downloadBlob } from "@/util/download";

/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-rose-700/70",
  disease: "bg-indigo-700/70",
  anatomy: "bg-rose-700/70",
  pathway: "bg-orange-700/70",
  default: "bg-slate-700/70",
};

/** search for ontologies */
export const ontologySearch = async (search: string) => {
  const url = new URL(`${api}/ontology/search/`);
  url.searchParams.set("query", search);
  const data = request(url, ontologies);
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
  const url = new URL(`${api}/geo-metadata/lookup/`);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ids },
  };
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
  const data = request(url, samples);
  return data;
};

/** submit study feedback */
export const studyFeedback = async (
  id: string,
  feedback: Feedback,
  user: { name: string; email: string },
) => {
  const url = new URL(`${api}/study/feedback/`);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { id, user, ...feedback },
  } as const;
  await request(url, z.unknown(), options);
};

/** lookup a cart by id */
export const cartLookup = async (id: string) => {
  const url = new URL(`${api}/cart/${id}/`);
  const data = request(url, cart);
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
  const data = request(url, cart, options);
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
  const data = await request(url, z.instanceof(Blob), options);
  if (type === "csv") downloadBlob(data, filename, "csv");
  if (type === "json") downloadBlob(data, filename, "json");
};

/** get download bash script */
export const getCartScript = (cart: Cart | LocalCart, database: string) =>
  [
    `#!/bin/bash`,
    `# Meta2Onto data cart download script`,
    `# Generated: ${new Date().toISOString()}`,
    "id" in cart ? `# ID: ${cart.id}` : "",
    "name" in cart ? `# Name: ${cart.name}` : "",
    `# Studies: ${cart.studies.length}`,
    ...cart.studies.map(({ id }) => [
      `# Download ${id} from ${database}`,
      `wget "${dbLink(getDb(database).link, id)}" -O ${id}_${database}.zip`,
    ]),
    `# Extract`,
    `for file in *.zip; do unzip "$file"; done`,
    `echo "Download complete"`,
  ]
    .flat()
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\n");
