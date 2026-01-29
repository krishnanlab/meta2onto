import type { Theme } from "@/util/dom";
import { useCallback, useState } from "react";
import { useEventListener } from "@reactuses/core";
import { isEqual } from "lodash";
import { getTheme } from "@/util/dom";

/** check if value changed from previous render */
export const useChanged = <Value>(value: Value) => {
  const [prev, setPrev] = useState<Value>();
  const changed = !isEqual(prev, value);
  if (changed) setPrev(value);
  return changed;
};

/** use root css vars reactively */
export const useTheme = () => {
  /** set of theme variable keys and values */
  const [theme, setTheme] = useState<Theme>({});

  /** update theme vars */
  const update = useCallback(() => setTheme(getTheme()), []);

  /** when document done loading */
  useEventListener("load", update, window);
  /** when fonts done loading */
  useEventListener("loadingdone", update, document.fonts);

  return theme;
};
