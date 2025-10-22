import type { QueryStatus } from "@tanstack/react-query";
import clsx from "clsx";
import { InfoIcon, LoaderCircle, TriangleAlert } from "lucide-react";

type Props = {
  status: QueryStatus;
  data: unknown[] | undefined;
  className?: string;
};

/** status block for query */
const Status = ({ status, data, className }: Props) => {
  const base = clsx(
    "flex items-center justify-center gap-2 rounded bg-current/5 p-4",
    className,
  );

  if (status === "pending")
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <LoaderCircle className="animate-spin" />
        Searching
      </span>
    );
  else if (status === "error")
    return (
      <span className={clsx(base, "text-red-500", className)}>
        <TriangleAlert />
        Error
      </span>
    );
  else if (status === "success" && data?.length === 0)
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <InfoIcon />
        No results
      </span>
    );
};

export default Status;
