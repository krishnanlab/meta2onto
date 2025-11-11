import ReactTimeAgo from "react-time-ago";
import clsx from "clsx";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import Tooltip from "@/components/Tooltip";
import { formatDate, parseDate } from "@/util/string";

type Props = {
  /** iso date string or date object */
  date: string | Date | undefined;
  /** class on time element */
  className?: string;
};

/** init library with english */
TimeAgo.addDefaultLocale(en);

/** show datetime in "ago" format, e.g. "20 min ago" */
export default function Component({ date, className }: Props) {
  /** parse arg as date */
  const parsed = parseDate(date);
  if (!parsed) return <span>???</span>;

  /** full date for tooltip */
  const full = formatDate(date);

  return (
    <Tooltip content={full || "???"}>
      <ReactTimeAgo
        className={clsx("text-nowrap", className)}
        date={parsed}
        locale="en-US"
        tabIndex={0}
      />
    </Tooltip>
  );
}
