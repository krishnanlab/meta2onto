import type { Feedback } from "@/api/types";
import { cloneDeep } from "lodash";
import { feedbacks } from "@/api/types";
import { setAtom, storageAtom } from "@/util/atoms";

/** study feedback state */
export const feedbackAtom = storageAtom("feedback", {}, feedbacks);

export const defaultFeedback: Feedback = {
  qualities: [],
  keywords: {},
  elaborate: "",
};

/** set feedback for study */
export const setFeedback = <Key extends keyof Feedback>(
  id: string,
  key: Key,
  value: Feedback[Key] | ((old: Feedback[Key]) => Feedback[Key]),
) =>
  setAtom(feedbackAtom, (old) => {
    const newFeedback = cloneDeep(old);
    newFeedback[id] ??= cloneDeep(defaultFeedback);
    newFeedback[id][key] =
      typeof value === "function" ? value(newFeedback[id][key]) : value;
    return newFeedback;
  });

/** clear feedback for study */
export const clearFeedback = (id: string) =>
  setAtom(feedbackAtom, (old) => {
    const newFeedback = cloneDeep(old);
    delete newFeedback[id];
    return newFeedback;
  });
