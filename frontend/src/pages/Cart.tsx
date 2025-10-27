import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnSort } from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { Download, Link, Plus, Share2, Trash } from "lucide-react";
import { cartLookup, shareCart, studyBatchLookup } from "@/api/api";
import { cartAtom, clearCart } from "@/cart";
import Button from "@/components/Button";
import Copy from "@/components/Copy";
import Database from "@/components/Database";
import Dialog from "@/components/Dialog";
import Heading from "@/components/Heading";
import { Meta } from "@/components/Meta";
import Pagination, { type PerPage } from "@/components/Pagination";
import Status, { showStatus } from "@/components/Status";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import { formatDate, formatNumber } from "@/util/string";

const Cart = () => {
  /** local, current cart */
  const localCart = useAtomValue(cartAtom);

  /** cart id from url */
  const { id = "" } = useParams();

  /** is this a shared cart or local */
  const shared = !!id;

  /** look up study ids from cart id */
  const studyIdsQuery = useQuery({
    queryKey: ["cart-lookup", id],
    queryFn: () => cartLookup(id),
    enabled: shared,
  });

  /** cart definition */
  const cart = shared ? studyIdsQuery.data : localCart;

  /** cart study ids */
  const studyIds = cart?.studies || [];

  /** cart size */
  const size = studyIds.length || 0;

  /** cart name */
  const [name, setName] = useState(studyIdsQuery.data?.name || id || "");

  /** pagination */
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<PerPage>("10");

  /** look up study details from study ids */
  const studyDetailsQuery = useQuery({
    queryKey: ["study-batch-lookup", id, ordering, offset, limit],
    queryFn: () =>
      studyBatchLookup({
        ids: studyIds,
        ordering: (ordering.desc ? "-" : "") + ordering.id,
        offset,
        limit: Number(limit),
      }),
    enabled: !!studyIds.length,
    placeholderData: keepPreviousData,
  });

  /** full study details */
  const studyDetails = studyDetailsQuery.data?.results || [];

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  /** share cart */
  const shareMutation = useMutation({
    mutationKey: ["share-cart"],
    mutationFn: () => shareCart(name, studyIds),
  });

  /** share url */
  const shareUrl =
    !shared && shareMutation.data
      ? `${window.location.origin}/cart/${shareMutation.data.id}`
      : "";

  /** reset share query state when cart changes */
  const { reset } = shareMutation;
  const _studyIds = JSON.stringify(studyIds);
  useEffect(() => {
    reset();
  }, [reset, _studyIds]);

  return (
    <>
      <Meta title={title} />

      <section className={"bg-theme-light"}>
        <Heading level={1}>{title}</Heading>
      </section>

      {shared && showStatus({ query: studyIdsQuery }) ? (
        <section>
          <Status query={studyIdsQuery} />
        </section>
      ) : (
        <>
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <span className="font-medium">
                  {size ? formatNumber(size) : 0} items
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {!shared && <Clear size={size} />}

                {!shared && (
                  <Dialog
                    trigger={
                      <Button disabled={!size}>
                        <Share2 />
                        Share
                      </Button>
                    }
                    title="Share Cart"
                    content={
                      <>
                        {!shareUrl && !showStatus({ query: shareMutation }) && (
                          <>
                            <p>Save this cart to a public link</p>
                            <Textbox
                              placeholder="Cart name"
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                            />
                            <Button onClick={() => shareMutation.mutate()}>
                              <Link />
                              Generate
                            </Button>
                          </>
                        )}

                        <Status query={shareMutation} />

                        {shareUrl && (
                          <>
                            <div className="flex flex-col gap-2">
                              Cart saved to:
                              <div className="flex gap-2">
                                <Textbox
                                  readOnly
                                  value={shareUrl}
                                  onFocus={(event) => event.target.select()}
                                />
                                <Copy content={shareUrl} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              Start a fresh cart:
                              <Clear size={size} />
                            </div>
                          </>
                        )}
                      </>
                    }
                  />
                )}

                <Button disabled={!size}>
                  <Download />
                  Download
                </Button>
              </div>
            </div>
          </section>

          <section>
            {!size && (
              <div className="flex flex-col items-center gap-4">
                <div>No studies yet</div>
                <Button to="/search">
                  <Plus />
                  Search
                </Button>
              </div>
            )}

            <Status
              query={studyDetailsQuery}
              loading={`Loading ${studyIds.length} studies`}
            />

            {!!studyDetails.length && (
              <>
                <Table
                  cols={[
                    { key: "id", name: "ID" },
                    { key: "name", name: "Name" },
                    { key: "samples", name: "Samples" },
                    {
                      key: "date",
                      name: "Date",
                      render: (date) => formatDate(date),
                    },
                    {
                      key: "database",
                      name: "Databases",
                      render: (database) =>
                        database.map((database, index) => (
                          <Database key={index} database={database} />
                        )),
                    },
                  ]}
                  rows={studyDetails}
                  sort={ordering}
                  onSort={setOrdering}
                  page={offset}
                  perPage={Number(limit)}
                />
                <Pagination
                  count={studyDetails.length}
                  page={offset}
                  setPage={setOffset}
                  perPage={limit}
                  setPerPage={setLimit}
                  pages={studyDetailsQuery.data?.pages ?? 0}
                />
              </>
            )}
          </section>
        </>
      )}
    </>
  );
};

export default Cart;

const Clear = ({ size }: { size: number }) => (
  <Button
    color="accent"
    disabled={!size}
    onClick={() => {
      if (window.confirm("Clear cart? Cannot be undone.")) clearCart();
    }}
  >
    <Trash />
    Clear
  </Button>
);
