import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Download, Plus, Share2, Trash } from "lucide-react";
import { cartLookup, studyBatchLookup } from "@/api/api";
import { cartAtom, clearCart } from "@/cart";
import Button from "@/components/Button";
import Heading from "@/components/Heading";
import { Meta } from "@/components/Meta";
import Status, { showStatus } from "@/components/Status";
import Table from "@/components/Table";
import { formatDate } from "@/util/string";

const Cart = () => {
  /** local, current cart */
  const localCart = useAtomValue(cartAtom);

  /** cart id from url */
  const { id = "" } = useParams();

  /** is this a shared cart or local */
  const shared = !!id;

  /** look up study ids from cart id */
  const studyIdsQuery = useQuery({
    queryKey: ["cart", id],
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
  const name = studyIdsQuery.data?.name ?? id;

  /** look up study details from study ids */
  const studyDetailsQuery = useQuery({
    queryKey: ["cart", id],
    queryFn: () => studyBatchLookup({ ids: studyIds }),
    enabled: !!studyIds.length,
  });

  /** full study details */
  const studyDetails = studyDetailsQuery.data?.results || [];

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  if (id && showStatus({ query: studyIdsQuery }))
    return (
      <>
        <Meta title={title} />

        <section>
          <Status
            query={studyIdsQuery}
            loading={`Loading shared cart "${id}"`}
          />
        </section>
      </>
    );

  return (
    <>
      <Meta title={title} />

      <section className={clsx("bg-theme-light", shared ? "sr-only" : "")}>
        <Heading level={1}>{title}</Heading>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {shared && <span>{title}</span>}
            <span className="font-medium">
              {size ? size.toLocaleString() : 0} items
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {!shared && (
              <Button
                color="accent"
                disabled={!size}
                onClick={() => {
                  if (
                    window.confirm("Clear cart? This action cannot be undone.")
                  )
                    clearCart();
                }}
              >
                <Trash />
                Clear
              </Button>
            )}

            {!shared && (
              <Button disabled={!size}>
                <Share2 />
                Share
              </Button>
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

        {!!studyIds.length && showStatus({ query: studyDetailsQuery }) && (
          <Status
            query={studyDetailsQuery}
            loading={`Loading ${studyIds.length} studies`}
          />
        )}

        {!!studyDetails.length && (
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
                render: (database) => (
                  <>
                    {database.map((database) => (
                      <span
                        key={database}
                        className="bg-theme-light rounded px-1"
                      >
                        {database}
                      </span>
                    ))}
                  </>
                ),
              },
            ]}
            rows={studyDetails}
          />
        )}
      </section>
    </>
  );
};

export default Cart;
