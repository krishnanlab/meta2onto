import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Tooltip from "@/components/Tooltip";
import { formatNumber } from "@/util/string";

export const perPageOptions = [
  { value: "5" },
  { value: "10" },
  { value: "20" },
  { value: "50" },
  { value: "100" },
] as const;

export type PerPage = (typeof perPageOptions)[number]["value"];

type Props = {
  count: number;
  page: number;
  setPage: (page: number) => void;
  perPage: PerPage;
  setPerPage: (perPage: PerPage) => void;
  pages: number;
};

/** pagination controls */
const Pagination = ({
  count,
  page,
  setPage,
  perPage,
  setPerPage,
  pages,
}: Props) => {
  if (!count || !pages) return null;

  const startItem = page * Number(perPage) + 1;
  const endItem = Math.min((page + 1) * Number(perPage), count);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* pagination */}
      <div className="flex items-center">
        <Button
          color="none"
          onClick={() => setPage(0)}
          disabled={page < 1}
          aria-label="First page"
        >
          <ChevronsLeft />
        </Button>
        <Button
          color="none"
          onClick={() => setPage(page - 1)}
          disabled={page < 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>

        <Tooltip
          content={
            <>
              Items {formatNumber(startItem)} to {formatNumber(endItem)} of{" "}
              {formatNumber(count)}
            </>
          }
        >
          <div className="px-2">
            Page {formatNumber(page + 1)} of {formatNumber(pages)}
          </div>
        </Tooltip>

        <Button
          color="none"
          onClick={() => setPage(page + 1)}
          disabled={page >= pages - 1}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
        <Button
          color="none"
          onClick={() => setPage(pages - 1)}
          disabled={page >= pages - 1}
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
              perPageOptions.find((option) => option.value === perPage)
                ?.value ?? perPageOptions[1].value
            }
            options={perPageOptions}
            onChange={(value) => setPerPage(value)}
          />
        </label>
      </div>
    </div>
  );
};

export default Pagination;
