import z from "zod";

export const ontologyResult = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string(),
  series_id: z.string(),
});

export type OntologyResult = z.infer<typeof ontologyResult>;

export const OntologyResults = z.array(ontologyResult);

export type OntologyResults = z.infer<typeof OntologyResults>;

export type Study = {
  gse: string;
  title: string;
  summary: string;
  confidence: { name: string; value: number };
  submission_date: string;
  platform: string;
  database: string[];
  samples: number;
};

export type StudySearch = {
  count: number;
  results: Study[];
  facets: {
    [facet: string]: {
      [value: string]: number;
    };
  };
};

export type Sample = {
  sample_id: string;
  doc: string;
  created_at: string;
  updated_at: string;
};

export type StudySamples = {
  count: number;
  results: Sample[];
};

export const cart = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  studies: z.array(
    z.object({
      id: z.string(),
      added: z.string(),
    }),
  ),
});

export type Cart = z.infer<typeof cart>;

export type CartDownload = {
  link: string;
};
