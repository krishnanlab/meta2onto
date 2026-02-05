import type {
  DefaultBodyType,
  HttpResponseResolver,
  JsonBodyType,
  PathParams,
} from "msw";
import type {
  Cart,
  Ontologies,
  Sample,
  Samples,
  Studies,
  Study,
} from "@/api/types";
import type { ShareCart } from "@/state/cart";
import { random, range, sample, uniq } from "lodash";
import { http, HttpResponse, passthrough } from "msw";
import { api } from "@/api";
import { sleep } from "@/util/misc";

const handler = <Method extends keyof typeof http>(
  method: Method,
  url: string,
  func: (props: Props) => JsonBodyType,
) =>
  http[method](url, async ({ request, params }) => {
    const url = new URL(request.url);
    const body = request.body ? await (await request.clone()).json() : {};
    await sleep(100);
    if (Math.random() < 0.1)
      return HttpResponse.json(null, { status: 500, statusText: "fake error" });
    return HttpResponse.json(func({ url, body, params }));
  });

/** non-mocked/handled request */
const nonMocked: HttpResponseResolver = ({ request }) => {
  console.debug("Non-mocked request", new URL(request.url).pathname);
  return passthrough();
};

const fakeWords =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

const fakeText = (min: number, max: number) =>
  range(random(min, max))
    .map(() => sample(fakeWords))
    .join(" ");

const fakeHighlight = (string: string, highlight: string) =>
  string
    .split(" ")
    .map((word) => (word.includes(highlight) ? `<mark>${word}</mark>` : word))
    .join(" ");

const fakeId = () => String(random(10000, 99999));

const fakeType = () => sample(["type-a", "type-b", "type-c"]);

const fakeDate = () =>
  new Date(
    random(
      new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 2,
      new Date().getTime(),
    ),
  ).toISOString();

const fakeConfidence = () => {
  const value = 1 - random(0, 1, true) * random(0, 1, true);
  let name = "Low";
  if (value > 0.7) name = "Medium";
  if (value > 0.9) name = "High";
  return { name, value };
};

const fakePlatform = () => sample(["RNA-seq", "scRNA-seq", "Microarray"]);

const fakeDatabase = () =>
  ["GEO", "SRA", "Refine.bio", "ARCHS4"].filter(() => Math.random() > 0.5);

const fakeFacets = () => ({
  Platform: {
    "RNA-seq": random(0, 200),
    Microarray: random(0, 200),
  },
  "Study Size": {
    label: "samples",
    min: 0,
    max: 666,
  },
  Confidence: {
    label: "%",
    min: 0,
    max: 100,
  },
});

const fakeSearch = <T>(data: T[], search: string) =>
  data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase()),
  );

type Props = {
  url: URL;
  body: DefaultBodyType;
  params: PathParams<string>;
};

const fakeOntologySearchResults: Ontologies = range(100).map(() => {
  const id = fakeText(1, 4);
  return {
    id,
    name: id,
    description: fakeText(4, 6),
    type: fakeType(),
    series: "",
  };
});

const fakeStudies: Study[] = range(100).map(() => ({
  id: fakeId(),
  name: fakeText(4, 20),
  description: fakeText(10, 200),
  confidence: fakeConfidence(),
  submitted_at: fakeDate(),
  platform: fakePlatform(),
  database: fakeDatabase(),
  sample_count: random(1, 200),
  keywords: [],
}));

const fakeSamples: Sample[] = range(100).map(() => ({
  id: fakeId(),
  type: fakeType(),
  description: fakeText(5, 20),
  created_at: fakeDate(),
  updated_at: fakeDate(),
}));

const fakeCarts: Cart[] = [];

export const handlers = [
  handler("get", `${api}/ontology/search`, ({ url }): Ontologies => {
    const search = url.searchParams.get("query") || "";
    const data = fakeOntologySearchResults.map((ontologySearchResult) => ({
      ...ontologySearchResult,
      name: fakeHighlight(ontologySearchResult.name, search),
      description: fakeHighlight(ontologySearchResult.description, search),
    }));
    return fakeSearch(data, search);
  }),

  handler("get", `${api}/study/search`, ({ url }): Studies => {
    let search = url.searchParams.get("query") || "";
    search = search.slice(0, search.indexOf(" "));
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const filteredData = fakeSearch(fakeStudies, search);
    const paginatedData = filteredData
      .slice(offset, offset + limit)
      .map((study) => ({
        ...study,
        description: fakeHighlight(study.description, search),
        keywords: uniq(study.description.split(" ")).slice(0, 10),
      }));
    return {
      count: filteredData.length,
      results: paginatedData,
      facets: fakeFacets(),
    };
  }),

  handler("post", `${api}/study/lookup`, ({ url }): Studies => {
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const filteredData = fakeStudies;
    const paginatedData = fakeStudies.slice(offset, offset + limit);
    return {
      count: filteredData.length,
      results: paginatedData,
      facets: fakeFacets(),
    };
  }),

  handler("get", `${api}/study/:id/samples`, ({ url }): Samples => {
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const paginatedData = fakeSamples.slice(offset, offset + limit);
    return {
      count: fakeSamples.length,
      results: paginatedData,
    };
  }),

  handler("post", `${api}/study/feedback`, () => ({
    message: "Feedback received",
  })),

  handler(
    "get",
    `${api}/cart/:id`,
    ({ params }): Cart | object =>
      fakeCarts.find((cart) => cart.id === params.id) ?? {},
  ),

  handler("post", `${api}/cart`, ({ body }): Cart => {
    const cart = {
      ...(body as ShareCart),
      id: fakeId(),
      created_at: fakeDate(),
    };
    fakeCarts.push(cart);
    return cart;
  }),

  http.get(/.*/, nonMocked),
  http.post(/.*/, nonMocked),
];
