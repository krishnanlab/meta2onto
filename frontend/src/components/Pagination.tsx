import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Tooltip from "@/components/Tooltip";
import { sleep } from "@/util/misc";
import { formatNumber } from "@/util/string";

const limitOptions = [
  { value: "5" },
  { value: "10" },
  { value: "20" },
  { value: "50" },
  { value: "100" },
] as const;

export type Limit = (typeof limitOptions)[number]["value"];

type Props = {
  count: number;
  offset: number;
  setOffset: (offset: number) => void;
  limit: Limit;
  setLimit: (limit: Limit) => void;
};

/** pagination controls */
export default function Pagination({
  count,
  offset,
  setOffset,
  limit,
  setLimit,
}: Props) {
  if (!count) return null;

  const _limit = Number(limit);
  const pages = Math.ceil(count / _limit);

  /** ensure offset is a multiple of limit */
  if (Math.round(offset / _limit) !== offset / _limit)
    sleep().then(() => setOffset(Math.floor(offset / _limit) * _limit));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* pagination */}
      <div className="flex items-center">
        <Button
          color="none"
          onClick={() => setOffset(0)}
          disabled={offset - _limit <= 0}
          aria-label="First page"
        >
          <ChevronsLeft />
        </Button>
        <Button
          color="none"
          onClick={() => setOffset(offset - _limit)}
          disabled={offset - _limit <= 0}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>

        <Tooltip
          content={
            <>
              Items {formatNumber(offset + 1)} to{" "}
              {formatNumber(Math.min(offset + _limit, count))} of{" "}
              {formatNumber(count)}
            </>
          }
        >
          <div className="px-2">
            Page {formatNumber(offset / _limit + 1)} of {formatNumber(pages)}
          </div>
        </Tooltip>

        <Button
          color="none"
          onClick={() => setOffset(offset + _limit)}
          disabled={offset + _limit >= count}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
        <Button
          color="none"
          onClick={() =>
            setOffset(Math.ceil((count - _limit) / _limit) * _limit)
          }
          disabled={offset + _limit >= count}
          aria-label="Last page"
        >
          <ChevronsRight />
        </Button>
      </div>

      {/* filters */}
      <div>
        {/* per page */}
        <label>
          Per page
          <Select
            value={
              limitOptions.find((option) => option.value === limit)?.value ??
              limitOptions[1].value
            }
            options={limitOptions}
            onChange={(value) => setLimit(value)}
          />
        </label>
      </div>
    </div>
  );
}
