import type { Theme } from "@/util/dom";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router";
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

/** debounced version of useSearchParams */
export const useDebouncedParams = (delay = 1000) => {
  /** search params currently in url that updates in debounced manner */
  const [url, setUrl] = useSearchParams();
  /** local copy of search params that updates instantly */
  const [instant, _setInstant] = useState(url);

  /** set instant params wrapper func */
  const setInstant = useCallback((func: (params: URLSearchParams) => void) => {
    _setInstant((params) => {
      /** make deep copy/new object to trigger re-render */
      params = new URLSearchParams(params);
      func(params);
      return params;
    });
  }, []);

  /** debounce timeout */
  const timeout = useRef(0);

  /** debounced set url search params */
  const debouncedSet = useEffectEvent(
    () => (timeout.current = window.setTimeout(() => setUrl(instant), delay)),
  );

  /** start setting url search params when instant params change */
  useEffect(() => {
    window.clearTimeout(timeout.current);
    debouncedSet();
    return () => window.clearTimeout(timeout.current);
  }, [instant]);

  /** update instant params when url search params change */
  if (useChanged(url)) _setInstant(new URLSearchParams(url));

  return [instant, setInstant, url, setUrl] as const;
};
