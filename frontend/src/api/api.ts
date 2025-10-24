import { api, request } from "@/api";
import {
  fakeCart,
  fakeDelay,
  fakeError,
  fakeSearch,
  fakeStudyQuickSearch,
  fakeStudySamples,
  fakeStudySearch,
} from "@/api/fake";

export type StudyQuickSearch = {
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

/** search for studies quickly (for autocompletel) and get high level info */
export const studyQuickSearch = async (search: string) => {
  const url = new URL(`${api}/study/quick-search`);
  url.searchParams.set("search", search);

  await fakeDelay();
  fakeError();
  return fakeSearch(fakeStudyQuickSearch, search);

  return request<StudyQuickSearch>(url);
};

export type StudySearch = {
  meta: {
    total: number;
    pages: number;
    limit: number;
  };
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

type StudySearchParams = {
  search: string;
  sort?: string;
  page?: number;
  facets?: Record<string, string[]>;
};

/** search for studies and get full details */
export const studySearch = async ({
  search,
  sort = "",
  page = 0,
  facets = {},
}: StudySearchParams) => {
  const url = new URL(`${api}/study/search`);
  url.searchParams.set("search", search);
  url.searchParams.set("sort", sort);
  url.searchParams.set("page", String(page));
  for (const [facet, values] of Object.entries(facets))
    for (const value of values) url.searchParams.append(facet, value);

  await fakeDelay();
  fakeError();
  return fakeStudySearch;

  return request<StudySearch>(url);
};

export type StudySamples = {
  name: string;
  description: string;
}[];

/** lookup all samples for a study */
export const studySamples = async (id: string) => {
  await fakeDelay();
  fakeError();
  return fakeStudySamples();

  return request<StudySamples>(`${api}/study/${id}/samples`);
};

export type CartLookup = { name: string; studies: string[] };

/** lookup a cart by id */
export const cartLookup = async (id: string) => {
  await fakeDelay();
  fakeError();
  return fakeCart();

  return request<CartLookup>(`${api}/cart/${id}`);
};

/** batch lookup full study details by ids */
export const studyBatchLookup = async (ids: string[]) => {
  const url = new URL(`${api}/study/lookup`);

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ids },
  };

  await fakeDelay();
  fakeError();
  return fakeStudySearch.results;

  return request<StudySearch["results"]>(url, options);
};
