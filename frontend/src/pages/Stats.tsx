import { useLocalStorage } from "@reactuses/core";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import {
  ChevronsDown,
  ChevronsUp,
  ScanSearch,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Button from "@/components/Button";
import { feedbackAtom } from "@/state/feedback";
import { getHistory, searchHistoryAtom } from "@/state/search";
import { formatNumber } from "@/util/string";

/** user's app stats */
export default function Stats() {
  const [show, setShow] = useLocalStorage("show-stats", true);

  const feedback = useAtomValue(feedbackAtom);
  const history = getHistory(useAtomValue(searchHistoryAtom));

  const studyThumbsUp = Object.values(feedback).filter(
    ({ rating }) => rating === 1,
  ).length;
  const studyThumbsDown = Object.values(feedback).filter(
    ({ rating }) => rating === -1,
  ).length;
  const uniqueSearches = Object.keys(history.grouped).length;

  const stats = [
    {
      Icon: ThumbsUp,
      value: formatNumber(studyThumbsUp),
      className: "bg-emerald-500/10 text-emerald-500",
      text: "positive feedback",
    },
    {
      Icon: ThumbsDown,
      value: formatNumber(studyThumbsDown),
      className: "bg-red-500/10 text-red-500",
      text: "negative feedback",
    },
    {
      Icon: ScanSearch,
      value: formatNumber(uniqueSearches),
      className: "bg-orange-500/10 text-orange-500",
      text: "unique searches",
    },
  ];

  if (stats.every(({ value }) => value === "0")) return null;

  return (
    <aside
      className={clsx(
        `
          fixed right-0 bottom-0 z-100 flex flex-col overflow-hidden
          rounded-tl-md bg-white leading-none shadow-md transition
        `,
        show ? "" : "translate-y-[calc(100%-(--spacing(8)))]",
      )}
    >
      <Button
        color="none"
        className="rounded-none"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide stats" : "Show stats"}
      >
        Your Stats
        {show ? <ChevronsDown /> : <ChevronsUp />}
      </Button>
      <div className="flex flex-col gap-1 p-2">
        {stats.map(({ Icon, value, className, text }, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={clsx(
                "grid size-8 shrink-0 place-items-center rounded-full",
                className,
              )}
            >
              {value}
            </div>
            <div className="flex w-full items-center gap-2">
              {text}
              <Icon className="ml-auto size-6 text-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
