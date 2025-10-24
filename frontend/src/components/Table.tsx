import type { ReactNode } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { NoInfer, SortingState } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveDown,
  MoveUp,
} from "lucide-react";
import Button from "@/components/Button";
import Select, { type Option } from "@/components/Select";
import { formatDate, formatNumber } from "@/util/string";

type Props<Datum extends object> = {
  cols: _Col<Datum>[];
  rows: Datum[];
  sort?: SortingState;
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
  [Key in keyof Datum]: Col<Datum, Key>;
}[keyof Datum];

const Table = <Datum extends object>({ cols, rows, sort }: Props<Datum>) => {
  /** per page options */
  const perPageOptions: Option[] = [5, 10, 25, 50, 100].map((value) => ({
    id: String(value),
    value: String(value),
  }));

  /** initial per page */
  const defaultPerPage = perPageOptions[1]!.id;

  const columnHelper = createColumnHelper<Datum>();
  /** column definitions */
  const columns = cols.map((col, index) =>
    columnHelper.accessor((row: Datum) => row[col.key], {
      /** unique column id, from position in provided column list */
      id: String(index),
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

  /** tanstack table api */
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
    /** initial sort, page, etc. state */
    initialState: {
      sorting: sort ?? [{ id: "0", desc: false }],
      pagination: {
        pageIndex: 0,
        pageSize: Number(defaultPerPage),
      },
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
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} aria-colindex={Number(header.id) + 1}>
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 leading-none">
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
                  aria-rowindex={
                    table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    index +
                    1
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      <div className="flex flex-wrap items-center gap-2 border-b-1 border-slate-100 p-2 leading-none">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-slate-500" colSpan={cols.length}>
                  No Rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* pagination */}
        <div className="flex items-center gap-2">
          <Button
            color="none"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            color="none"
            onClick={table.previousPage}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>

          <div className="px-2">
            Page {formatNumber(table.getState().pagination.pageIndex + 1)} of{" "}
            {formatNumber(table.getPageCount())}
          </div>

          <Button
            color="none"
            onClick={table.nextPage}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            color="none"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
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
              value={defaultPerPage}
              options={perPageOptions}
              onChange={(option) => {
                table.setPageSize(Number(option));
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Table;

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
