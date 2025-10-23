import { request } from "@/api";
import { fakeFull, fakeQuick, fakeSamples, fakeSearch } from "@/api/fake";
import { sleep } from "@/util/misc";

export type QuickSearch = {
  type: string;
  name: string;
  description: string;
};

/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-rose-700/70",
  disease: "bg-indigo-700/70",
  anatomy: "bg-rose-700/70",
  pathway: "bg-orange-700/70",
  default: "bg-gray-700/70",
};

export const quickSearch = async (search: string) => {
  await sleep(100);
  // throw Error("test");
  return fakeSearch(fakeQuick, search);
  request<QuickSearch>(`/api/sample-search`, { params: { q: search } });
};

export type FullSearch = {
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

export const fullSearch = async (search: string) => {
  await sleep(100);
  // throw Error("test");
  return {
    results: fakeFull.results,
    facets: fakeFull.facets,
  };
  request<QuickSearch>(`/api/sample-search`, { params: { q: search } });
};

export type SamplesLookup = {
  name: string;
  description: string;
}[];

export const sampleLookup = async (id: string) => {
  await sleep(1000);
  // throw Error("test");
  return fakeSamples(id);
  request<SamplesLookup>(`/api/sample/${id}`);
};
