import { request } from "@/api";
import { sleep } from "@/util/misc";

type SampleSearch = {
  type: string;
  name: string;
  description: string;
};

/** type to color map */
export const typeColor: Record<string, string> = {
  tissue: "bg-rose-700/70",
  disease: "bg-indigo-700/70",
};

/** sample data search */
export const sampleSearch = async (search: string) => {
  /** temp test */
  await sleep(1000);
  // throw Error("fake error");
  const fakeData: SampleSearch[] = [
    {
      type: "tissue",
      name: "hepatoblast",
      description: "immature liver cell",
    },
    {
      type: "disease",
      name: "hepatocellular carcinoma",
      description: "liver cancer",
    },
    {
      type: "tissue",
      name: "hepatic stellate cell",
      description: "liver support cell",
    },
  ];
  return fakeData.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase()),
  );

  request<SampleSearch>(`/api/sample-search`, { params: { q: search } });
};
