export type Model = {
  id: string;
  type: string;
  name: string;
  description: string;
  series_id: string;
};

export type ModelSearch = Model[];

export type Study = {
  gse: string;
  title: string;
  summary: string;
  confidence: { name: string; value: number };
  submission_date: string;
  platform: string;
  database: string[];
  samples_ct: number;
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
  // sample_id: string;
  // doc: string;
  // created_at: string;
  // updated_at: string;
  id: string;
  description: string;
  data_processing: string;
};

export type StudySamples = {
  count: number;
  results: Sample[];
};

export type Cart = {
  id: string;
  name: string;
  created_at: string;
  studies: { id: string; added: string }[];
};

export type CartDownload = {
  link: string;
};
