import type { ColumnSort } from "@tanstack/react-table";
import type { Cart } from "@/api/types";
import type { LocalCart } from "@/cart";
import type { Limit } from "@/components/Pagination";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import {
  ArrowRight,
  Braces,
  Clipboard,
  Download,
  LinkIcon,
  Mail,
  Plus,
  Share2,
  Table2,
  Terminal,
  Trash,
} from "lucide-react";
import {
  cartLookup,
  downloadCart,
  getCartScript,
  shareCart,
  studyBatchLookup,
} from "@/api/api";
import {
  addCreatedCart,
  cartAtom,
  clearCart,
  clearCreatedCarts,
  createdCartsAtom,
  removeFromCart,
} from "@/cart";
import ActionButton, { copy } from "@/components/ActionButton";
import Ago from "@/components/Ago";
import BigRadios from "@/components/BigRadios";
import Button from "@/components/Button";
import Database, { databases } from "@/components/Database";
import Dialog from "@/components/Dialog";
import Heading from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";
import Pagination from "@/components/Pagination";
import Popover from "@/components/Popover";
import Status, { showStatus } from "@/components/Status";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import { downloadSh } from "@/util/download";
import { highlightBash } from "@/util/highlighting";
import { formatNumber } from "@/util/string";

export default function Cart() {
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

  /** remote, shared cart */
  const sharedCart = studyIdsQuery.data;

  /** cart study ids */
  const studyIds = ((localCart || sharedCart).studies || []).map(
    (study) => study.id,
  );

  /** cart size */
  const size = studyIds.length || 0;

  /** cart name */
  const name = studyIdsQuery.data?.name || id;

  /** custom cart name for sharing */
  const [shareName, setShareName] = useState(name);

  /** pagination */
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

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
    enabled: !!size,
    placeholderData: keepPreviousData,
  });

  /** reset query state on disable */
  const queryClient = useQueryClient();
  if (!size) queryClient.resetQueries({ queryKey: ["study-batch-lookup"] });

  /** full study details */
  const studyDetails = studyDetailsQuery.data?.results || [];

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  /** share cart */
  const shareMutation = useMutation({
    mutationKey: ["share-cart", localCart],
    mutationFn: () => shareCart({ ...localCart, name: shareName }),
    onSuccess: addCreatedCart,
  });

  /** share url */
  const shareUrl =
    !shared && shareMutation.data
      ? new URL(`${window.location.origin}/cart/${shareMutation.data.id}`)
      : "";

  /** reset share query state when cart changes */
  const { reset } = shareMutation;
  const _studyIds = JSON.stringify(studyIds);
  useEffect(() => {
    reset();
  }, [reset, _studyIds]);

  /** created carts */
  const createdCarts = useAtomValue(createdCartsAtom);

  return (
    <>
      <Meta title={title} />

      <section className="bg-theme-light">
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
              {/* cart details */}
              <div className="flex flex-wrap gap-4">
                <span className="font-medium">
                  {size ? formatNumber(size) : 0} items
                </span>
              </div>

              {/* cart actions */}
              <div className="flex flex-wrap gap-2">
                {!shared && <Clear size={size} />}

                {!shared && (
                  <Dialog
                    title="Share Cart"
                    content={
                      <>
                        {!shareUrl && !showStatus({ query: shareMutation }) && (
                          <>
                            <div>Save this cart to a public link</div>
                            <Textbox
                              placeholder="Cart name"
                              value={shareName}
                              onChange={setShareName}
                            />
                            <Button onClick={() => shareMutation.mutate()}>
                              <LinkIcon />
                              Generate
                            </Button>
                          </>
                        )}

                        <Status query={shareMutation} />

                        {shareUrl && (
                          <>
                            <div className="flex flex-col gap-2">
                              <p>Cart saved to:</p>
                              <Textbox
                                readOnly
                                value={String(shareUrl)}
                                onFocus={(event) => event.target.select()}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <ActionButton
                                  onClick={() => copy(String(shareUrl))}
                                >
                                  <Clipboard />
                                  Copy
                                </ActionButton>

                                <Button
                                  to={`mailto:?body=${encodeURIComponent(String(shareUrl))}`}
                                >
                                  <Mail />
                                  Email
                                </Button>
                                <Button to={shareUrl.pathname}>
                                  <ArrowRight />
                                  View
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <p>Start fresh cart:</p>
                              <Clear size={size} />
                            </div>
                          </>
                        )}
                      </>
                    }
                    onClose={() => {
                      if (shareMutation.isError) reset();
                    }}
                  >
                    <Button aria-disabled={!size}>
                      <Share2 />
                      Share
                    </Button>
                  </Dialog>
                )}

                {(localCart || sharedCart) && (
                  <>
                    <Popover
                      content={
                        <>
                          <ActionButton
                            onClick={() =>
                              downloadCart(studyIds, name || "cart", "csv")
                            }
                          >
                            <Table2 />
                            CSV
                          </ActionButton>

                          <ActionButton
                            onClick={() =>
                              downloadCart(studyIds, name || "cart", "json")
                            }
                          >
                            <Braces />
                            JSON
                          </ActionButton>
                        </>
                      }
                    >
                      <Button aria-disabled={!size}>
                        <Download />
                        Download
                      </Button>
                    </Popover>

                    <Dialog
                      title="Download Script"
                      content={
                        <DownloadScript
                          name={name}
                          cart={localCart || sharedCart}
                        />
                      }
                    >
                      <Button aria-disabled={!size}>
                        <Terminal />
                        Bash
                      </Button>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* cart contents */}
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
                    {
                      key: "gse",
                      name: "ID",
                    },
                    {
                      key: "title",
                      name: "Name",
                    },
                    {
                      key: "samples",
                      name: "Samples",
                    },
                    {
                      key: "submission_date",
                      name: "Date",
                      render: (date) => <Ago date={date} />,
                    },
                    {
                      key: "database",
                      name: "Databases",
                      render: (database) =>
                        database.map((database, index) => (
                          <Database key={index} database={database} />
                        )),
                    },
                    {
                      key: "added",
                      name: "Added",
                      render: (added) => <Ago date={added} />,
                    },
                    {
                      key: "gse",
                      name: "",
                      sortable: false,
                      render: (id) => (
                        <Button onClick={() => removeFromCart(id)} color="none">
                          <Trash />
                        </Button>
                      ),
                    },
                  ]}
                  rows={studyDetails.map((study) => ({
                    ...study,
                    added:
                      localCart?.studies.find((s) => s.id === study.gse)
                        ?.added ?? "2025-01-01T00:00:00.000Z",
                  }))}
                  sort={ordering}
                  onSort={setOrdering}
                  page={offset}
                  perPage={Number(limit)}
                />
                <Pagination
                  count={studyDetails.length}
                  offset={offset}
                  setOffset={setOffset}
                  limit={limit}
                  setLimit={setLimit}
                />
              </>
            )}
          </section>

          {/* cart creation history */}
          <section>
            <Heading level={2}>History</Heading>

            <p className="self-center text-center">
              Carts you've created from this device
            </p>

            <div
              className={clsx(
                "grid max-w-max gap-4 self-center",
                createdCarts.length === 1
                  ? "grid-cols-1"
                  : createdCarts.length === 2
                    ? `
                      grid-cols-2
                      max-sm:grid-cols-1
                    `
                    : `
                      grid-cols-3
                      max-md:grid-cols-2
                      max-sm:grid-cols-1
                    `,
              )}
            >
              {createdCarts.map(({ id, name, studies }, index) => (
                <Link
                  key={index}
                  to={`/cart/${id}`}
                  className="
                    flex flex-col items-start gap-2 rounded-sm border
                    border-slate-300 p-2
                  "
                >
                  <strong>{name || id}</strong>
                  <span>{formatNumber(studies.length)} studies</span>
                </Link>
              ))}
            </div>

            {!!createdCarts.length && (
              <Button
                className="self-center"
                onClick={() =>
                  window.confirm("Clear created carts? Cannot be undone.") &&
                  clearCreatedCarts()
                }
              >
                <Trash />
                Forget
              </Button>
            )}
          </section>
        </>
      )}
    </>
  );
}

/** clear cart button */
const Clear = ({ size }: { size: number }) => (
  <Button
    color="accent"
    aria-disabled={!size}
    onClick={() => {
      if (window.confirm("Clear cart? Cannot be undone.")) clearCart();
    }}
  >
    <Trash />
    Clear
  </Button>
);

/** bash download script popup */
const DownloadScript = ({
  name,
  cart,
}: {
  name: string;
  cart: LocalCart | Cart;
}) => {
  const [database, setDatabase] = useState(databases[0]?.id ?? "");

  /** script text */
  const script = getCartScript(cart, database);

  return (
    <>
      <div className="flex flex-col gap-4 overflow-y-auto">
        <BigRadios
          className="w-200 max-w-full"
          label={
            <>
              <strong>Database</strong> to download from
            </>
          }
          options={databases.map(({ id }) => ({
            value: id,
            render: <Database database={id} full={true} />,
          }))}
          value={database}
          onChange={setDatabase}
        />

        <div className="flex flex-col gap-2">
          <span>
            <strong>Bash script</strong> to download cart directly from database
          </span>
          <code>
            <pre dangerouslySetInnerHTML={{ __html: highlightBash(script) }} />
          </code>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => downloadSh(script, name || "cart")}>
          <Download />
          Download
        </Button>
        <ActionButton onClick={() => copy(script)}>
          <Clipboard />
          Copy
        </ActionButton>
      </div>
    </>
  );
};
