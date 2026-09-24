import type { ReactNode } from "react";
import type {
  Cell,
  NoInfer,
  PaginationState,
  RowData,
  SortingState,
} from "@tanstack/react-table";
import {
  columnFacetingFeature,
  columnFilteringFeature,
  createColumnHelper,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  functionalUpdate,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { ArrowUpDown, MoveDown, MoveUp } from "lucide-react";
import Button from "@/components/Button";
import Tooltip from "@/components/Tooltip";
import { formatDate, formatNumber, likelyDate } from "@/util/string";

type Props<Datum extends RowData> = {
  columns: _Columns<Datum>[];
  rows: Datum[];
  sort?: SortingState[number];
  onSort?: (sort: SortingState[number]) => void;
  page?: PaginationState["pageIndex"];
  onPage?: (page: PaginationState["pageIndex"]) => void;
  perPage?: PaginationState["pageSize"];
  onPerPage?: (perPage: PaginationState["pageSize"]) => void;
  className?: string;
  grow?: boolean;
};

export type Column<
  Datum extends RowData = RowData,
  Key extends keyof Datum = keyof Datum,
> = {
  /** key of row object to access as cell value */
  key: Key;
  /** label for header */
  name: string;
  /** is sortable (default true) */
  sortable?: boolean;
  /** custom render function for cell */
  render?: (cell: NoInfer<Datum[Key]>, row: Datum) => ReactNode;
};

/**
 * https://stackoverflow.com/questions/68274805/typescript-reference-type-of-property-by-other-property-of-same-object
 * https://github.com/vuejs/core/discussions/8851
 */
type _Columns<Datum extends RowData> = {
  [Key in keyof Datum]: Column<Datum, Key extends keyof Datum ? Key : never>;
}[keyof Datum];

const features = tableFeatures({
  columnFilteringFeature,
  columnFacetingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

type Features = typeof features;

export default function Table<Datum extends RowData>({
  columns,
  rows,
  sort,
  onSort,
  page,
  onPage,
  perPage,
  onPerPage,
  className,
  grow = false,
}: Props<Datum>) {
  const columnHelper = createColumnHelper<Features, Datum>();

  const columnDefinitions = columnHelper.columns(
    columns.map((column, index) =>
      columnHelper.accessor((row) => row[column.key], {
        /** unique column id */
        id: String(index),
        /** name */
        header: column.name,
        /** sortable */
        enableSorting: column.sortable ?? true,
        /** render func for cell */
        cell: ({ cell, row }) => {
          const raw = cell.getValue();
          const rendered = column.render?.(raw, row.original);
          return rendered === undefined || rendered === null
            ? defaultFormat(raw)
            : rendered;
        },
      }),
    ),
  );

  /** current sorting state */
  const sorting = sort?.id ? [sort] : [];

  /** current pagination state */
  const pagination = { pageIndex: page ?? 0, pageSize: perPage ?? 10 };

  /** table api */
  const table = useTable({
    features,
    data: rows,
    columns: columnDefinitions,
    autoResetPageIndex: true,
    manualPagination: true,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      /** https://github.com/TanStack/table/discussions/4005 */
      const newSort = functionalUpdate(updater, sorting);
      onSort?.(newSort[0] ?? { id: "", desc: false });
    },
    onPaginationChange: (updater) => {
      /** https://github.com/TanStack/table/discussions/4005 */
      const { pageIndex, pageSize } = functionalUpdate(updater, pagination);
      onPage?.(pageIndex);
      onPerPage?.(pageSize);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table
          aria-rowcount={table.getPrePaginatedRowModel().rows.length}
          aria-colcount={columns.length}
          className={clsx("border-collapse", className)}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-stone-100">
                {headerGroup.headers.map((header, index) => (
                  <th key={header.id} aria-colindex={index + 1}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={clsx(
                          "flex items-center gap-2 p-2",
                          grow && "w-max max-w-200",
                        )}
                      >
                        {/* header label */}
                        <span>
                          <table.FlexRender header={header} />
                        </span>

                        {/* sort control */}
                        {header.column.getCanSort() && (
                          <Button
                            color="none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {header.column.getIsSorted() ? (
                              header.column.getIsSorted() === "asc" ? (
                                <MoveUp />
                              ) : (
                                <MoveDown />
                              )
                            ) : (
                              <ArrowUpDown className="text-stone-300" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="odd:bg-white even:bg-stone-50"
                  aria-rowindex={
                    pagination.pageIndex * pagination.pageSize + index + 1
                  }
                >
                  {row.getAllCells().map((cell) => {
                    const render =
                      index > 0 && getCellAbove(cell) ? (
                        /** repeat cell above */
                        <Tooltip content="Same as above">
                          <span tabIndex={0}>...</span>
                        </Tooltip>
                      ) : (
                        /** render as normal */
                        <table.FlexRender cell={cell} />
                      );
                    return (
                      <td key={cell.id}>
                        <div
                          className={clsx(
                            "flex flex-wrap items-center gap-2 p-2",
                            grow && "w-max max-w-200",
                          )}
                        >
                          {render}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-stone-500" colSpan={columns.length}>
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** default cell formatter based on detected type */
const defaultFormat = (cell: unknown) => {
  if (typeof cell === "number") return formatNumber(cell);
  if (typeof cell === "boolean") return cell ? "True" : "False";
  /** if falsey (except 0 and false) */
  if (!cell) return "-";
  if (Array.isArray(cell)) return cell.length.toLocaleString();
  if (cell instanceof Date || (typeof cell === "string" && likelyDate(cell)))
    return formatDate(cell);
  if (typeof cell === "object")
    return Object.keys(cell).length.toLocaleString();
  if (typeof cell === "string") return cell;
  return String(cell);
};

/** get cell above current cell */
const getCellAbove = <Datum extends RowData, Value>(
  cell: Cell<Features, Datum, Value>,
) =>
  cell.column
    .getFacetedRowModel()
    .flatRows[cell.row.index - 1]?.getAllCells()
    .find((c) => c.column.id === cell.column.id)
    ?.getValue() === cell.getValue();
