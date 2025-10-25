import { api, request } from "@/api";
import {
  fakeCart,
  fakeDelay,
  fakeError,
  fakeModelSearch,
  fakeSearch,
  fakeStudySamples,
  fakeStudySearch,
} from "@/api/fake";

export type ModelSearch = {
  type: string;
  name: string;
  description: string;
}[];

/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-rose-700/70",
  disease: "bg-indigo-700/70",
  anatomy: "bg-rose-700/70",
  pathway: "bg-orange-700/70",
  default: "bg-gray-700/70",
};

/** search for models */
export const modelSearch = async (search: string) => {
  const url = new URL(`${api}/model`);
  url.searchParams.set("search", search);

  await fakeDelay();
  fakeError();
  return fakeSearch(fakeModelSearch, search);

  return request<ModelSearch>(url);
};

export type StudySearch = {
  count: number;
  results: {
    id: string;
    name: string;
    confidence: { name: string; value: number };
    description: string;
    date: string;
    platform: string;
    database: string[];
    samples: number;
  }[];
  facets: {
    [facet: string]: {
      [value: string]: number;
    };
  };
};

/** search for studies and get full details */
export const studySearch = async ({
  search = "",
  ordering = "",
  offset = 0,
  limit = 100,
  facets = {} as Record<string, string[]>,
}) => {
  const url = new URL(`${api}/study`);
  url.searchParams.set("search", search);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  for (const [facet, values] of Object.entries(facets))
    for (const value of values) url.searchParams.append(facet, value);

  await fakeDelay();
  fakeError();
  const data = fakeStudySearch;

  // const data = request<StudySearch>(url);
  return { ...data, pages: Math.ceil(data.count / limit) };
};

/** batch lookup full study details by ids */
export const studyBatchLookup = async ({
  ids = [] as string[],
  ordering = "",
  offset = 0,
  limit = 100,
}) => {
  const url = new URL(`${api}/study/lookup`);
  url.searchParams.set("ordering", ordering);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ids },
  };

  await fakeDelay();
  fakeError();
  const data = fakeStudySearch;

  // const data = request<StudySearch>(url, options);
  return { ...data, pages: Math.ceil(data.count / limit) };
};

export type StudySamples = {
  count: number;
  results: {
    name: string;
    description: string;
  }[];
};

/** lookup all samples for a study */
export const studySamples = async ({ id = "", offset = 0, limit = 10 }) => {
  const url = new URL(`${api}/study/${id}/samples`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));

  await fakeDelay();
  fakeError();
  const data = fakeStudySamples();

  // const data = request<StudySamples>(url);
  return { ...data, pages: Math.ceil(data.count / limit) };
};

export type CartLookup = { name: string; studies: string[] };

/** lookup a cart by id */
export const cartLookup = async (id: string) => {
  const url = new URL(`${api}/cart/${id}`);

  await fakeDelay();
  fakeError();
  return fakeCart();

  return request<CartLookup>(url);
};
