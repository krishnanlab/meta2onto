import type { Cart, ModelSearch, StudySamples, StudySearch } from "@/api/types";
import type { LocalCart, ShareCart } from "@/cart";
import { api, request } from "@/api";
import { downloadBlob } from "@/util/download";

/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-rose-700/70",
  disease: "bg-indigo-700/70",
  anatomy: "bg-rose-700/70",
  pathway: "bg-orange-700/70",
  default: "bg-gray-700/70",
};

/** search for ontologies */
export const modelSearch = async (search: string) => {
  const url = new URL(`${api}/ontology/search/`);
  url.searchParams.set("query", search);
  const data = request<ModelSearch>(url);
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
  const data = await request<StudySearch>(url);
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
  const data = await request<StudySearch>(url, options);
  return data;
};

/** lookup all samples for a study */
export const studySamples = async ({ id = "", offset = 0, limit = 10 }) => {
  const url = new URL(`${api}/study/${id}/samples/`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const data = request<StudySamples>(url);
  return data;
};

/** lookup a cart by id */
export const cartLookup = async (id: string) => {
  const url = new URL(`${api}/cart/${id}/`);
  const data = request<Cart>(url);
  return data;
};

/** share cart */
export const shareCart = async (cart: ShareCart) => {
  const url = new URL(`${api}/cart/`);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cart,
  };
  const data = request<Cart>(url, options);
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
  const data = await request<Blob>(url, options);
  if (type === "csv") downloadBlob(data, filename, "csv");
  if (type === "json") downloadBlob(data, filename, "json");
};

/** download links for each database */
const downloadTemplates: Record<string, string> = {
  "Refine.bio": "https://www.refine.bio/v1/download/$ID.zip",
};

/** get download bash script */
export const getCartScript = (cart: Cart | LocalCart, database: string) => {
  const template = downloadTemplates[database] ?? "";
  return [
    `#!/bin/bash`,
    `# Meta2Onto data cart download script`,
    `# Generated: ${new Date().toISOString()}`,
    "id" in cart ? `# ID: ${cart.id}` : "",
    "name" in cart ? `# Name: ${cart.name}` : "",
    `# Studies: ${cart.studies.length}`,
    ...cart.studies.map(({ id }) => [
      `# Download ${id} from ${database}`,
      `wget "${template.replace(/\$ID/g, id)}" -O ${id}_${database}.zip`,
    ]),
    `# Extract`,
    `for file in *.zip; do unzip "$file"; done`,
    `echo "Download complete"`,
  ]
    .flat()
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\n");
};
