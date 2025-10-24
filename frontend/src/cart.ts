import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { uniq } from "lodash";
import type { CartLookup } from "@/api/api";

const defaultCart: CartLookup = {
  name: "",
  items: [],
};

/** cart state */
export const cartAtom = atomWithStorage<CartLookup>("cart", defaultCart);

export const inCart = (cart: CartLookup, item: string) =>
  cart?.items.includes(item);

export const addToCart = (item: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    items: uniq([...old.items, item]),
  }));

export const removeFromCart = (item: string) =>
  getDefaultStore().set(cartAtom, (old) => ({
    ...old,
    items: old.items.filter((i) => i !== item),
  }));

export const clearCart = () => getDefaultStore().set(cartAtom, defaultCart);
