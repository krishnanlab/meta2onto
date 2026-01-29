import type { Model } from "@/api/types";
import { findLastIndex, groupBy, orderBy } from "lodash";
import { model } from "@/api/types";
import { getAtom, setAtom, storageAtom } from "@/util/atoms";

/** search history */
export const searchHistoryAtom = storageAtom(
  "search-history",
  [],
  model.array(),
);

/** search history limit */
const limit = 100;

/** add search term to history */
export const addSearch = (search: Model) =>
  setAtom(searchHistoryAtom, (old) => {
    const history = [...old, search];
    if (history.length > limit) history.shift();
    return history;
  });

/** get search history */
export const getHistory = () => {
  const history = getAtom(searchHistoryAtom);
  const grouped = Object.entries(groupBy(history, "id"));
  /** weight searches by frequency and recency */
  const weighted = grouped.map(([id, dupes]) => ({
    search: dupes[0]!,
    weight: dupes.length + findLastIndex(history, (other) => other.id === id),
  }));
  return orderBy(weighted, "weight").map(({ search }) => search);
};
