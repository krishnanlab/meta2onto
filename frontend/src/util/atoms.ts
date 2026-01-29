import type { Atom, PrimitiveAtom } from "jotai";
import type z from "zod";
import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/vanilla/utils";

/** get atom util func */
export const getAtom = <Value>(atom: Atom<Value>) =>
  getDefaultStore().get(atom);

/** set atom util func */
export const setAtom = <Value>(
  atom: PrimitiveAtom<Value>,
  update: Value | ((value: Value) => Value),
) => {
  getDefaultStore().set(atom, update);
  return getAtom(atom);
};

/** storage atom with type-safe get */
export const storageAtom = <Schema extends z.ZodType>(
  key: string,
  initial: z.infer<Schema>,
  schema: Schema,
) =>
  atomWithStorage(
    key,
    initial,
    {
      /** type-safe get */
      getItem: (key, initialValue): z.infer<Schema> => {
        try {
          return schema.parse(JSON.parse(localStorage.getItem(key) ?? ""));
        } catch (error) {
          console.groupCollapsed(`error parsing storage key "${key}"`);
          console.warn("clearing key");
          console.error(error);
          console.groupEnd();
          localStorage.removeItem(key);
          return initialValue;
        }
      },
      setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
      removeItem: localStorage.removeItem,
    },
    { getOnInit: true },
  );
