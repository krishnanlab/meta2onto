import type z from "zod";
import type { Cart } from "@/api/types";
import { isEqual, uniqBy, uniqWith } from "lodash";
import { cart } from "@/api/types";
import { setAtom, storageAtom } from "@/util/atoms";

/** cart object, before user selects name or submits */
export const localCart = cart.omit({ id: true, name: true, created_at: true });
/** cart object, after user selects name but before they submit */
export const shareCart = cart.omit({ id: true, created_at: true });

/** cart object, before user selects name or submits */
export type LocalCart = z.infer<typeof localCart>;
/** cart object, after user selects name but before they submit */
export type ShareCart = z.infer<typeof shareCart>;

const defaultCart: LocalCart = { studies: [] };

/** cart state */
export const cartAtom = storageAtom("cart", defaultCart, localCart);

/** is study in cart */
export const inCart = (cart: LocalCart, study: string) =>
  cart?.studies.find((s) => s.id === study);

/** add study id to cart */
export const addToCart = (study: string) =>
  setAtom(cartAtom, (old) => ({
    ...old,
    studies: uniqBy(
      [...old.studies, { id: study, added: new Date().toISOString() }],
      "id",
    ),
  }));

/** remove study id from cart */
export const removeFromCart = (study: string) =>
  setAtom(cartAtom, (old) => ({
    ...old,
    studies: old.studies.filter((oldStudy) => oldStudy.id !== study),
  }));

/** clear cart */
export const clearCart = () => setAtom(cartAtom, defaultCart);

/** cart creation history */
export const createdCartsAtom = storageAtom("created-carts", [], cart.array());

/** add cart to creation history */
export const addCreatedCart = (cart: Cart) =>
  setAtom(createdCartsAtom, (old) => uniqWith([...old, cart], isEqual));

/** clear cart creation history */
export const clearCreatedCarts = () => setAtom(createdCartsAtom, []);
