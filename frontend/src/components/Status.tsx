import type { ReactNode } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import clsx from "clsx";
import { isEmpty as _isEmpty } from "lodash";
import { Check, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import Tooltip from "@/components/Tooltip";

type Query =
  | Pick<UseQueryResult, "data" | "status" | "error" | "isFetching">
  | Pick<UseMutationResult, "data" | "status" | "error">;

type Props = {
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  success?: ReactNode;
  showSuccess?: boolean;
  query: Query;
  className?: string;
};

/** status block for query */
export default function Status({
  loading = "Loading",
  error = "Error",
  empty = "No results",
  success = "Success",
  showSuccess = false,
  query,
  className,
}: Props) {
  className = clsx(
    "flex items-center justify-center gap-2 rounded-md p-4",
    className,
  );

  if (isLoading(query))
    return (
      <span className={clsx("bg-stone-100 text-stone-700", className)}>
        <LoaderCircle className="animate-spin" />
        {loading}
      </span>
    );

  if (isError(query))
    return (
      <span className={clsx("bg-red-100 text-red-700", className)}>
        <TriangleAlert />
        <Tooltip content={query.error?.message}>
          <span className="underline decoration-dashed underline-offset-2">
            {error}
          </span>
        </Tooltip>
      </span>
    );

  if (isEmpty(query))
    return (
      <span className={clsx("bg-stone-100 text-stone-500", className)}>
        <Info />
        {empty}
      </span>
    );

  if (showSuccess && isSuccess(query))
    return (
      <span className={clsx("bg-emerald-100 text-emerald-700", className)}>
        <Check />
        {success}
      </span>
    );
}

/** is there any status to show */
export const showStatus = (props: Props) => !!Status(props);

/** is loading */
export const isLoading = (query: Query) =>
  "isFetching" in query ? query.isFetching : query.status === "pending";

/** is error */
export const isError = (query: Query) => query.status === "error";

/** is empty */
export const isEmpty = (query: Query) =>
  query.status === "success" && _isEmpty(query.data);

/** is success */
export const isSuccess = (query: Query) => query.status === "success";
