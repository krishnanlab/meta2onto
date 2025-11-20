import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { findLastIndex, groupBy, orderBy } from "lodash";
import type { Model } from "@/api/types";

/** search history */
export const searchHistoryAtom = atomWithStorage<Model[]>(
  "search-history",
  [],
  undefined,
  { getOnInit: true },
);

/** search history limit */
const limit = 100;

/** add search term to history */
export const addSearch = (search: Model) =>
  getDefaultStore().set(searchHistoryAtom, (old) => {
    const history = [...old, search];
    if (history.length > limit) history.shift();
    return history;
  });

/** get search history */
export const getHistory = () => {
  const history = getDefaultStore().get(searchHistoryAtom);
  const grouped = Object.entries(groupBy(history, "id"));
  /** weight searches by frequency and recency */
  const weighted = grouped.map(([id, dupes]) => ({
    search: dupes[0]!,
    weight: dupes.length + findLastIndex(history, (other) => other.id === id),
  }));
  return orderBy(weighted, "weight").map(({ search }) => search);
};
