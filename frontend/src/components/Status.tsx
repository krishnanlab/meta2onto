import type { UseQueryResult } from "@tanstack/react-query";
import clsx from "clsx";
import { isEmpty } from "lodash";
import { InfoIcon, LoaderCircle, TriangleAlert } from "lucide-react";

type Props = {
  query: UseQueryResult;
  className?: string;
};

/** status block for query */
const Status = ({ query, className }: Props) => {
  const base = clsx(
    "flex items-center justify-center gap-2 rounded bg-current/5 p-4",
    className,
  );

  if (query.status === "pending" || query.isFetching)
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <LoaderCircle className="animate-spin" />
        Searching
      </span>
    );
  else if (query.status === "error")
    return (
      <span className={clsx(base, "text-red-500", className)}>
        <TriangleAlert />
        Error
      </span>
    );
  else if (query.status === "success" && isEmpty(query.data))
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <InfoIcon />
        No results
      </span>
    );
};

export default Status;

/** is there any status to show */
export const showStatus = (props: Props) => !!Status(props);
