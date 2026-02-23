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
      getItem: (key, initial): z.infer<Schema> => {
        const value = localStorage.getItem(key);
        if (!value) {
          console.debug(`No value for storage key "${key}"`);
          return initial;
        }
        try {
          return schema.parse(JSON.parse(localStorage.getItem(key) ?? ""));
        } catch (error) {
          console.groupCollapsed(
            `Error parsing storage key "${key}", clearing`,
          );
          console.error(error);
          console.groupEnd();
          localStorage.removeItem(key);
          return initial;
        }
      },
      setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
      removeItem: localStorage.removeItem,
    },
    { getOnInit: true },
  );
