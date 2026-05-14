import analytics from "react-ga4";
import * as z from "zod";
import { request } from "@/api";

const api = `https://api.refine.bio/v1`;

export const dataset = z.object({
  id: z.string().optional(),
  data: z.unknown().optional(),
  success: z.boolean().optional(),
  failure_reason: z.string().optional(),
});

/** export cart of studies to refine.bio dataset */
export const makeDataset = async (ids: string[], email = "") => {
  const url = new URL(`${api}/dataset/`);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      data: Object.fromEntries(ids.map((id) => [id, ["ALL"]])),
      aggregate_by: "ALL",
      scale_by: "NONE",
      email_address: email,
      email_ccdl_ok: !!email,
      notify_me: !!email,
      start: true,
      quantile_normalize: true,
      quant_sf_only: true,
      svd_algorithm: "NONE",
    },
  } as const;
  const data = await request(url, dataset, options);
  analytics.event("refine.bio_make_dataset", { ids, data });
  if (!data.success) throw Error(data.failure_reason ?? "Unknown error");
  return data;
};
