import { random, sample, uniq } from "lodash";
import type { FullSearch, QuickSearch, SamplesLookup } from "@/api/api";

export const words =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

export const phrase = (min: number, max: number, format = false) =>
  Array(random(min, max))
    .fill(null)
    .map(() => sample(words))
    .map((word) =>
      format && Math.random() > 0.9 ? `<mark>${word}</mark>` : word,
    )
    .join(" ");

export const type = () =>
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

export const fakeSearch = <T>(items: T[], search: string) =>
  items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase()),
  );

export const fakeQuick: QuickSearch[] = uniq(
  Array(20)
    .fill(null)
    .map(() => phrase(1, 4)),
).map((name) => ({
  type: type(),
  name,
  description: phrase(4, 6, true),
}));

export const fakeFull: FullSearch = {
  results: Array(20)
    .fill(null)
    .map(() => ({
      id: `GSE${random(10000, 99999)}`,
      name: phrase(4, 20),
      confidence: (() => {
        const value = random(0, 1, true);
        let name = "Low";
        if (value > 0.7) name = "Medium";
        if (value > 0.9) name = "High";
        return { name, value };
      })(),
      description: phrase(10, 200, true),
      date: "2025-03-15",
      platform: sample(["RNA-seq", "scRNA-seq", "Microarray"]),
      database: ["GEO", "SRA", "Refine.bio", "ARCHS4"].filter(
        () => Math.random() > 0.5,
      ),
      samples: random(1, 200),
    })),
  facets: {
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
  },
};

export const fakeSamples = (id: string): SamplesLookup =>
  Array(random(5, 50))
    .fill(null)
    .map((_, index) => ({
      name: `${id}_${index}`,
      description: phrase(5, 20, true),
    }));
