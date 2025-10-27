import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { uniq } from "lodash";
import type { CartLookup } from "@/api/api";

const defaultCart = {
  name: "",
  studies: [] as { id: string; added: string }[],
  created: "",
};

/** cart state */
export const cartAtom = atomWithStorage("cart", defaultCart);

/** is study in cart */
export const inCart = (cart: CartLookup, study: string) =>
  cart?.studies.includes(study);

/** add study id to cart */
export const addToCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: uniq([
      ...old.studies,
      { id: study, added: new Date().toISOString() },
    ]),
  }));

/** remove study id from cart */
export const removeFromCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: old.studies.filter((oldStudy) => oldStudy.id !== study),
  }));

/** clear cart */
export const clearCart = () => getDefaultStore().set(cartAtom, defaultCart);
