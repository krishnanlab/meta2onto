import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Download, Plus, Share2, Trash } from "lucide-react";
import { cartLookup } from "@/api/api";
import { cartAtom, clearCart } from "@/cart";
import Button from "@/components/Button";
import Heading from "@/components/Heading";
import { Meta } from "@/components/Meta";
import Status, { showStatus } from "@/components/Status";

const Cart = () => {
  /** local, current cart */
  const localCart = useAtomValue(cartAtom);

  /** cart id from url */
  const { id = "" } = useParams();

  /** is this a shared cart or local */
  const shared = !!id;

  /** look up cart items from id */
  const query = useQuery({
    queryKey: ["cart", id],
    queryFn: () => cartLookup(id),
    enabled: shared,
  });

  /** cart definition */
  const cart = shared ? query.data : localCart;

  /** cart size */
  const size = cart?.items.length || 0;

  /** cart name */
  const name = query.data?.name ?? id;

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  if (id && showStatus({ query }))
    return (
      <>
        <Meta title={title} />

        <section>
          <Status query={query} loading={`Loading shared cart "${id}"`} />
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
            <div>No items yet</div>
            <Button to="/search">
              <Plus />
              Search
            </Button>
          </div>
        )}
        {!!size && (
          <ul>
            {cart?.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

export default Cart;
