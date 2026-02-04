import z from "zod";

export const ontology = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string(),
  series: z.string(),
});

export type Ontology = z.infer<typeof ontology>;

export const ontologies = z.array(ontology);

export type Ontologies = z.infer<typeof ontologies>;

export const study = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  confidence: z.object({
    name: z.string(),
    value: z.number(),
  }),
  submitted_at: z.iso.datetime(),
  platform: z.string(),
  database: z.array(z.string()),
  sample_count: z.number(),
  keywords: z.array(z.string()),
});

export type Study = z.infer<typeof study>;

export const studies = z.object({
  count: z.number(),
  results: z.array(study),
  facets: z.record(
    z.string(),
    z.record(z.string(), z.union([z.number(), z.string()])),
  ),
});

export type Studies = z.infer<typeof studies>;

export const sample = z.object({
  id: z.string(),
  description: z.string(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type Sample = z.infer<typeof sample>;

export const samples = z.object({
  count: z.number(),
  results: z.array(sample),
});

export type Samples = z.infer<typeof samples>;

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

export const feedback = z.object({
  qualities: z.array(z.string()),
  keywords: z.record(z.string(), z.string()),
  elaborate: z.string(),
});

export type Feedback = z.infer<typeof feedback>;

export const feedbacks = z.record(z.string(), feedback);

export type Feedbacks = z.infer<typeof feedbacks>;
