import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { isEqual, uniqBy, uniqWith } from "lodash";
import type { Cart } from "@/api/types";

/** cart object, minus assigned id and selected name */
export type LocalCart = Omit<Cart, "id" | "name">;
/** cart object, after user selects name but before they submit */
export type ShareCart = Omit<Cart, "id">;

const defaultCart: LocalCart = {
  studies: [],
};

/** cart state */
export const cartAtom = atomWithStorage("cart", defaultCart);

/** is study in cart */
export const inCart = (cart: LocalCart, study: string) =>
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
export const createdCartsAtom = atomWithStorage<Cart[]>("created-carts", []);

/** add cart to creation history */
export const addCreatedCart = (cart: Cart) =>
  getDefaultStore().set(createdCartsAtom, (old) =>
    uniqWith([...old, cart], isEqual),
  );

/** clear cart creation history */
export const clearCreatedCarts = () =>
  getDefaultStore().set(createdCartsAtom, []);
