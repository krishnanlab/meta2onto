import type {
  DefaultBodyType,
  HttpResponseResolver,
  JsonBodyType,
  PathParams,
} from "msw";
import type {
  Cart,
  CartDownload,
  Model,
  ModelSearch,
  Sample,
  Study,
  StudySamples,
  StudySearch,
} from "@/api/types";
import type { ShareCart } from "@/cart";
import { random, range, sample } from "lodash";
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
    if (Math.random() < 0.25)
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

const fakeType = () =>
  sample([
    "gene",
    "disease",
    "compound",
    "anatomy",
    "phenotype",
    "symptom",
    "genotype",
    "variant",
    "pathway",
  ]);

const fakeDate = () =>
  new Date(
    random(
      new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 2,
      new Date().getTime(),
    ),
  ).toISOString();

const fakeConfidence = () => {
  const value = random(0, 1, true);
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
    "< 10 samples": random(0, 200),
    "10-50 samples": random(0, 200),
    "> 50 samples": random(0, 200),
  },
  Confidence: {
    High: random(0, 200),
    Medium: random(0, 200),
    Low: random(0, 200),
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

const fakeModels: Model[] = range(100).map(() => {
  const id = fakeText(1, 4);
  return {
    id,
    name: id,
    description: fakeText(4, 6),
    type: fakeType(),
    series_id: "",
  };
});

const fakeStudies: Study[] = range(100).map(() => ({
  gse: fakeId(),
  title: fakeText(4, 20),
  summary: fakeText(10, 200),
  confidence: fakeConfidence(),
  submission_date: fakeDate(),
  platform: fakePlatform(),
  database: fakeDatabase(),
  samples: random(1, 200),
}));

const fakeSamples: Sample[] = range(100).map(() => ({
  sample_id: fakeId(),
  doc: fakeText(5, 20),
  created_at: fakeDate(),
  updated_at: fakeDate(),
}));

const fakeCarts: Cart[] = [];

export const handlers = [
  handler("get", `${api}/ontology-search`, ({ url }): ModelSearch => {
    const search = url.searchParams.get("query") || "";
    const data = fakeModels.map((model) => ({
      ...model,
      name: fakeHighlight(model.name, search),
      description: fakeHighlight(model.description, search),
    }));
    return fakeSearch(data, search);
  }),

  handler("get", `${api}/geo-metadata/search`, ({ url }): StudySearch => {
    let search = url.searchParams.get("query") || "";
    search = search.slice(0, search.indexOf(" "));
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const filteredData = fakeSearch(fakeStudies, search);
    const paginatedData = filteredData
      .slice(offset, offset + limit)
      .map((study) => ({
        ...study,
        summary: fakeHighlight(study.summary, search),
      }));
    return {
      count: filteredData.length,
      results: paginatedData,
      facets: fakeFacets(),
    };
  }),

  handler("post", `${api}/study/lookup`, ({ url }): StudySearch => {
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

  handler("get", `${api}/study/:id/samples`, ({ url }): StudySamples => {
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const paginatedData = fakeSamples.slice(offset, offset + limit);
    return {
      count: fakeSamples.length,
      results: paginatedData,
    };
  }),

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

  handler(
    "post",
    `${api}/cart/download`,
    (): CartDownload => ({
      link: "https://example.com/download/fake_cart.zip",
    }),
  ),

  http.get(/.*/, nonMocked),
  http.post(/.*/, nonMocked),
];
