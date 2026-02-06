import type { Ontologies, Ontology } from "@/api/types";
import { findLastIndex, groupBy, orderBy } from "lodash";
import { ontologies } from "@/api/types";
import { getAtom, setAtom, storageAtom } from "@/util/atoms";

/** search history */
export const searchHistoryAtom = storageAtom("search-history", [], ontologies);

/** search history limit */
const limit = 1000;

/** add search term to history */
export const addSearch = (search: Ontology) =>
  setAtom(searchHistoryAtom, (old) => {
    const history = [...old, search];
    if (history.length > limit) history.shift();
    return history;
  });

/** get search history */
export const getHistory = (history?: Ontologies) => {
  history ??= getAtom(searchHistoryAtom);
  const grouped = groupBy(history, "id");
  const searches = Object.entries(grouped).map(([id, dupes]) => ({
    search: dupes[0]!,
    /** weight by frequency and recency */
    weight: dupes.length + findLastIndex(history, (other) => other.id === id),
  }));
  return { list: orderBy(searches, "weight"), grouped };
};
