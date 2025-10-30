import { useCallback, useRef, useState } from "react";
import { useEventListener } from "@reactuses/core";
import { isEqual } from "lodash";
import { getTheme, type Theme } from "@/util/dom";

/** check if value changed from previous render */
export const useChanged = <Value>(value: Value, initial = true) => {
  const prev = useRef<Value | undefined>(undefined);
  const changed = !isEqual(value, prev.current);
  const result = initial ? changed : changed && prev.current !== undefined;
  prev.current = value;
  return result;
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
