import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { isEqual, uniqBy, uniqWith } from "lodash";
import type { CartLookup } from "@/api/types";

const defaultCart: CartLookup = {
  id: "",
  name: "",
  studies: [],
  created: "",
};

/** cart state */
export const cartAtom = atomWithStorage("cart", defaultCart);

/** is study in cart */
export const inCart = (cart: CartLookup, study: string) =>
  cart?.studies.find((s) => s.id === study);

/** add study id to cart */
export const addToCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: uniqBy(
      [...old.studies, { id: study, added: new Date().toISOString() }],
      "id",
    ),
  }));

/** remove study id from cart */
export const removeFromCart = (study: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    studies: old.studies.filter((oldStudy) => oldStudy.id !== study),
  }));

/** clear cart */
export const clearCart = () => getDefaultStore().set(cartAtom, defaultCart);

/** cart creation history */
export const createdCartsAtom = atomWithStorage<CartLookup[]>(
  "created-carts",
  [],
);

/** add cart to creation history */
export const addCreatedCart = (cart: CartLookup) =>
  getDefaultStore().set(createdCartsAtom, (old) =>
    uniqWith([...old, cart], isEqual),
  );

/** clear cart creation history */
export const clearCreatedCarts = () =>
  getDefaultStore().set(createdCartsAtom, []);
