import { useRef } from "react";
import { isEqual } from "lodash";

/** check if value changed from previous render */
export const useChanged = <Value>(value: Value, initial = true) => {
  const prev = useRef<Value | undefined>(undefined);
  const changed = !isEqual(value, prev.current);
  const result = initial ? changed : changed && prev.current !== undefined;
  prev.current = value;
  return result;
};
