import type { ReactNode } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import clsx from "clsx";
import { isEmpty } from "lodash";
import { InfoIcon, LoaderCircle, TriangleAlert } from "lucide-react";

type Query =
  | Pick<UseQueryResult, "data" | "status" | "error" | "isFetching">
  | Pick<UseMutationResult, "data" | "status" | "error">;

type Props = {
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  query: Query;
  className?: string;
};

/** status block for query */
const Status = ({
  loading = "Loading",
  error = "Error",
  empty = "No results",
  query,
  className,
}: Props) => {
  const base = clsx(
    "flex items-center justify-center gap-2 rounded bg-current/5 p-4",
    className,
  );

  if ("isFetching" in query ? query.isFetching : query.status === "pending")
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <LoaderCircle className="animate-spin" />
        {loading}
      </span>
    );
  else if (query.status === "error")
    return (
      <span className={clsx(base, "text-red-500", className)}>
        <TriangleAlert />
        {error}
      </span>
    );
  else if (query.status === "success" && isEmpty(query.data))
    return (
      <span className={clsx(base, "text-slate-500", className)}>
        <InfoIcon />
        {empty}
      </span>
    );
};

export default Status;

/** is there any status to show */
export const showStatus = (props: Props) => !!Status(props);
