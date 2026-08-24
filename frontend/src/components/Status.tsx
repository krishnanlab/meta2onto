import type { ReactNode } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import clsx from "clsx";
import { isEmpty } from "lodash";
import { Info, LoaderCircle, TriangleAlert } from "lucide-react";
import Tooltip from "@/components/Tooltip";

type Query =
  | Pick<
      UseQueryResult<unknown, unknown>,
      "data" | "status" | "error" | "isFetching"
    >
  | Pick<UseMutationResult<unknown, unknown>, "data" | "status" | "error">;

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

  if (isLoading(query))
    return (
      <span className={clsx("bg-stone-100 text-stone-500", className)}>
        <LoaderCircle className="animate-spin" />
        {loading}
      </span>
    );
  else if (isError(query))
    return (
      <span className={clsx("bg-red-100 text-red-500", className)}>
        <TriangleAlert />
        <Tooltip content={getErrorMessage(query.error)}>
          <span className="underline decoration-dashed underline-offset-2">
            {error}
          </span>
        </Tooltip>
      </span>
    );
  else if (isSuccess(query))
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

/** is loading */
export const isLoading = (query: Query) =>
  "isFetching" in query ? query.isFetching : query.status === "pending";

/** is error */
export const isError = (query: Query) => query.status === "error";

/** is success */
export const isSuccess = (query: Query) =>
  query.status === "success" && isEmpty(query.data);

/** safely extract a message from an unknown error value */
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : undefined;
