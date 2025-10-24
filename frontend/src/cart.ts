import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { uniq } from "lodash";
import type { CartLookup } from "@/api/api";

const defaultCart: CartLookup = {
  name: "",
  studies: [],
};

/** cart state */
export const cartAtom = atomWithStorage<CartLookup>("cart", defaultCart);

export const inCart = (cart: CartLookup, study: string) =>
  cart?.studies.includes(study);

export const addToCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: uniq([...old.studies, study]),
  }));

export const removeFromCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: old.studies.filter((oldStudy) => oldStudy !== study),
  }));

export const clearCart = () => getDefaultStore().set(cartAtom, defaultCart);
