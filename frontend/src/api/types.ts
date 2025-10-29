export type ModelSearch = {
  type: string;
  name: string;
  description: string;
}[];

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

export type StudySamples = {
  count: number;
  results: {
    name: string;
    description: string;
  }[];
};

export type CartLookup = {
  id: string;
  name: string;
  studies: { id: string; added: string }[];
  created: string;
};
