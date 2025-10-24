import { api, request } from "@/api";
import {
  fakeDelay,
  fakeError,
  fakeFull,
  fakeQuick,
  fakeSamples,
  fakeSearch,
} from "@/api/fake";

export type QuickSearch = {
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

export const quickSearch = async (search: string) => {
  const url = new URL(`${api}/api/quick-search`);
  url.searchParams.set("search", search);

  await fakeDelay();
  fakeError();
  return fakeSearch(fakeQuick, search);

  return request<QuickSearch>(url);
};

export type FullSearch = {
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

type FullSearchParams = {
  search: string;
  sort?: string;
  page?: number;
  facets?: Record<string, string[]>;
};

export const fullSearch = async ({
  search,
  sort = "",
  page = 0,
  facets = {},
}: FullSearchParams) => {
  const url = new URL(`${api}/api/full-search`);
  url.searchParams.set("search", search);
  url.searchParams.set("sort", sort);
  url.searchParams.set("page", String(page));
  for (const [facet, values] of Object.entries(facets))
    for (const value of values) url.searchParams.append(facet, value);

  await fakeDelay();
  fakeError();
  return fakeFull;

  return request<FullSearch>(url);
};

export type SamplesLookup = {
  name: string;
  description: string;
}[];

export const sampleLookup = async (id: string) => {
  await fakeDelay();
  fakeError();
  return fakeSamples(id);

  return request<SamplesLookup>(`${api}/api/sample/${id}`);
};
