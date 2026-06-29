import type { ReactNode } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import clsx from "clsx";
import { isEmpty } from "lodash";
import { Info, LoaderCircle, TriangleAlert } from "lucide-react";
import Tooltip from "@/components/Tooltip";

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
function Status({
  loading = "Loading",
  error = "Error",
  empty = "No results",
  query,
  className,
}: Props) {
  className = clsx(
    "flex items-center justify-center gap-2 rounded-md p-4",
    className,
  );

  if ("isFetching" in query ? query.isFetching : query.status === "pending")
    return (
      <span className={clsx("bg-stone-100 text-stone-500", className)}>
        <LoaderCircle className="animate-spin" />
        {loading}
      </span>
    );
  else if (query.status === "error")
    return (
      <span className={clsx("bg-red-100 text-red-500", className)}>
        <TriangleAlert />
        <Tooltip content={query.error?.message}>
          <span className="underline decoration-dashed underline-offset-2">
            {error}
          </span>
        </Tooltip>
      </span>
    );
  else if (query.status === "success" && isEmpty(query.data))
    return (
      <span className={clsx("bg-stone-100 text-stone-500", className)}>
        <Info />
        {empty}
      </span>
    );
}

export default Status;

/** is there any status to show */
export const showStatus = (props: Props) => !!Status(props);
