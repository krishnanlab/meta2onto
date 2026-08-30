import z from "zod";

export const ontology = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string(),
  series: z.string(),
  performance: z.string(),
});

export type Ontology = z.infer<typeof ontology>;

export const ontologies = z.array(ontology);

export type Ontologies = z.infer<typeof ontologies>;

export const cart = z.object({
  id: z.string(),
  name: z.string(),
  studies: z.array(
    z.object({
      id: z.string(),
      added: z.string(),
      search: z.string(),
      term: z.string(),
    }),
  ),
});

export type Cart = z.infer<typeof cart>;

export const feedback = z.object({
  rating: z.number().min(-1).max(1),
  qualities: z.array(z.string()),
  keywords: z.record(z.string(), z.string()),
  elaborate: z.string(),
});

export type Feedback = z.infer<typeof feedback>;

export const feedbacks = z.record(z.string(), feedback);

export type Feedbacks = z.infer<typeof feedbacks>;
