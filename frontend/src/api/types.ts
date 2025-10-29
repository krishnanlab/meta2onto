export type Model = {
  type: string;
  id: string;
  name: string;
  description: string;
};

export type ModelSearch = Model[];

export type Study = {
  id: string;
  name: string;
  description: string;
  confidence: { name: string; value: number };
  date: string;
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
  id: string;
  description: string;
};

export type StudySamples = {
  count: number;
  results: Sample[];
};

export type Cart = {
  id: string;
  name: string;
  studies: { id: string; added: string }[];
};

export type CartDownload = {
  link: string;
};
