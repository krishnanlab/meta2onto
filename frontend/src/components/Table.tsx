import type { ReactNode } from "react";
import type {
  Cell,
  NoInfer,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoveDown, MoveUp } from "lucide-react";
import Button from "@/components/Button";
import { formatDate, formatNumber } from "@/util/string";

type Props<Datum extends object> = {
  cols: _Col<Datum>[];
  rows: Datum[];
  sort?: SortingState[number];
  onSort?: (sort: SortingState[number]) => void;
  page?: PaginationState["pageIndex"];
  onPage?: (page: PaginationState["pageIndex"]) => void;
  perPage?: PaginationState["pageSize"];
  onPerPage?: (perPage: PaginationState["pageSize"]) => void;
};

type Col<
  Datum extends object = object,
  Key extends keyof Datum = keyof Datum,
> = {
  /** key of row object to access as cell value */
  key: Key;
  /** label for header */
  name: string;
  /** is sortable (default true) */
  sortable?: boolean;
  /**
   * custom render function for cell. return undefined or null to fallback to
   * default formatting.
   */
  render?: (cell: NoInfer<Datum[Key]>, row: Datum) => ReactNode;
};

/**
 * https://stackoverflow.com/questions/68274805/typescript-reference-type-of-property-by-other-property-of-same-object
 * https://github.com/vuejs/core/discussions/8851
 */
type _Col<Datum extends object> = {
  [Key in keyof Datum]: Col<Datum, Key extends string ? Key : never>;
}[keyof Datum];

export default function Table<Datum extends object>({
  cols,
  rows,
  sort,
  onSort,
  page,
  onPage,
  perPage,
  onPerPage,
}: Props<Datum>) {
  "use no memo";

  const columnHelper = createColumnHelper<Datum>();
  /** column definitions */
  const columns = cols.map((col, index) =>
    columnHelper.accessor((row: Datum) => row[col.key], {
      /** unique column id */
      id: `${col.key}_${index}`,
      /** name */
      header: col.name,
      /** sortable */
      enableSorting: col.sortable ?? true,
      /** render func for cell */
      cell: ({ cell, row }) => {
        const raw = cell.getValue();
        const rendered = col.render?.(raw, row.original);
        return rendered === undefined || rendered === null
          ? defaultFormat(raw)
          : rendered;
      },
    }),
  );

  /** current sorting state */
  const sorting = sort?.id ? [sort] : [];

  /** current pagination state */
  const pagination = { pageIndex: page ?? 0, pageSize: perPage ?? 10 };

  /** tanstack table api */
  /** https://github.com/facebook/react/issues/33057 */
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getColumnCanGlobalFilter: () => true,
    autoResetPageIndex: true,
    columnResizeMode: "onChange",
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
          aria-rowcount={table.getPrePaginationRowModel().rows.length}
          aria-colcount={cols.length}
          className="border-collapse"
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-100">
                {headerGroup.headers.map((header, index) => (
                  <th key={header.id} aria-colindex={index + 1}>
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2 p-2">
                        {/* header label */}
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                              <ArrowUpDown className="text-slate-300" />
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
                  className="
                    odd:bg-white
                    even:bg-slate-50
                  "
                  aria-rowindex={
                    table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    index +
                    1
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const render =
                      index > 0 && getCellAbove(cell)
                        ? /** repeat cell above */
                          "..."
                        : /** render as normal */
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          );
                    return (
                      <td key={cell.id}>
                        <div className="flex flex-wrap items-center gap-2 p-2">
                          {render}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-slate-500" colSpan={cols.length}>
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
  if (cell instanceof Date) return formatDate(cell);
  if (typeof cell === "object")
    return Object.keys(cell).length.toLocaleString();
  if (typeof cell === "string") return cell;
  return String(cell);
};

/** get cell above current cell */
const getCellAbove = <Datum, Value>(cell: Cell<Datum, Value>) =>
  cell.column
    .getFacetedRowModel()
    .flatRows[cell.row.index - 1]?.getAllCells()
    .find((c) => c.column.id === cell.column.id)
    ?.getValue() === cell.getValue();
