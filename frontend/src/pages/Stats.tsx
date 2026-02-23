import { useState } from "react";
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

/** user's app stats */
export default function Stats() {
  const [show, setShow] = useState(true);

  const feedback = useAtomValue(feedbackAtom);
  const history = getHistory(useAtomValue(searchHistoryAtom));

  const studyThumbsUp = Object.values(feedback).filter(
    ({ rating }) => rating === 1,
  ).length;
  const studyThumbsDown = Object.values(feedback).filter(
    ({ rating }) => rating === -1,
  ).length;
  const uniqueSearches = Object.keys(history.grouped).length.toLocaleString();

  const stats = [
    {
      Icon: ThumbsUp,
      value: studyThumbsUp,
      className: "bg-emerald-50 text-emerald-900",
      text: "positive feedback",
    },
    {
      Icon: ThumbsDown,
      value: studyThumbsDown,
      className: "bg-red-50 text-red-900",
      text: "negative feedback",
    },
    {
      Icon: ScanSearch,
      value: uniqueSearches,
      className: "bg-yellow-50 text-yellow-900",
      text: "unique searches",
    },
  ];

  if (stats.every(({ value }) => value === 0)) return null;

  return (
    <aside
      className={clsx(
        `
          fixed right-0 bottom-0 z-100 flex flex-col rounded-tl-md bg-white
          leading-none shadow-md transition
          *:flex *:items-center *:gap-2 *:p-4
        `,
        show ? "" : "translate-y-[calc(100%---spacing(8))]",
      )}
    >
      <Button
        color="none"
        className="h-8"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide stats" : "Show stats"}
      >
        Your Stats
        {show ? <ChevronsDown /> : <ChevronsUp />}
      </Button>
      {stats.map(({ Icon, value, className, text }, index) => (
        <div key={index} className={className}>
          <Icon />
          <span>{value}</span>
          <span>{text}</span>
        </div>
      ))}
    </aside>
  );
}
