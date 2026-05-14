import type { ColumnSort } from "@tanstack/react-table";
import type { Cart } from "@/api/types";
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
  SquareArrowRightEnter,
  Table2,
  Trash,
} from "lucide-react";
import {
  cartLookup,
  downloadCart,
  shareCart,
  studyBatchLookup,
} from "@/api/api";
import { makeDataset } from "@/api/refine.bio";
import ActionButton, { copy } from "@/components/ActionButton";
import Ago from "@/components/Ago";
import Button from "@/components/Button";
import DatabaseBadge from "@/components/Database";
import Dialog from "@/components/Dialog";
import Heading from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";
import Pagination from "@/components/Pagination";
import Popover from "@/components/Popover";
import Status, { showStatus } from "@/components/Status";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import { useUser } from "@/pages/user";
import {
  addCreatedCart,
  cartAtom,
  clearCart,
  clearCreatedCarts,
  createdCartsAtom,
  removeFromCart,
} from "@/state/cart";
import { formatNumber } from "@/util/string";

export default function Cart() {
  /** local, current cart */
  const localCart = useAtomValue(cartAtom);

  /** cart id from url */
  const { id = "" } = useParams();

  /** is this a shared cart or local */
  const shared = !!id;

  /** look up study ids from cart id */
  const cartLookupQuery = useQuery({
    queryKey: ["cart-lookup", id],
    queryFn: () => cartLookup(id),
    enabled: shared,
  });

  /** remote, shared cart */
  const sharedCart = cartLookupQuery.data;

  /** current cart */
  const cart = localCart || sharedCart;

  /** cart study ids */
  const studyIds = (cart.studies || []).map((study) => study.id);

  /** cart size */
  const size = studyIds.length || 0;

  /** cart name */
  const name = cartLookupQuery.data?.name || id;

  /** custom cart name for sharing */
  const [shareName, setShareName] = useState(name);

  /** pagination */
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

  /** look up study details from study ids */
  const studyBatchLookupQuery = useQuery({
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
  const studyDetails = studyBatchLookupQuery.data?.results || [];

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  /** share cart */
  const shareMutation = useMutation({
    mutationKey: ["share-cart", localCart],
    mutationFn: () => shareCart({ ...localCart, name: shareName }),
    onSuccess: addCreatedCart,
  });

  /** share cart result link */
  const shareLink =
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

  /** filter study ids by ones that are in refine.bio */
  const refineBioStudyIds = studyDetails
    .filter((study) => study.database.includes("Refine.bio"))
    .map((study) => study.id);

  /** export to refine.bio */
  const refineBioMutation = useMutation({
    mutationKey: ["refine-bio", refineBioStudyIds],
    mutationFn: () => makeDataset(refineBioStudyIds),
  });

  /** export refio.bio result link */
  const refineBioLink = refineBioMutation.data
    ? new URL(`https://www.refine.bio/dataset/${refineBioMutation.data.id}`)
    : "";

  /** user self-identification */
  const { userEmail, setUserEmail } = useUser();

  return (
    <>
      <Meta title={title} />

      <section className="bg-theme-light">
        <Heading level={1}>{title}</Heading>
      </section>

      {shared && showStatus({ query: cartLookupQuery }) ? (
        <section>
          <Status query={cartLookupQuery} />
        </section>
      ) : (
        <>
          <section>
            <div className="flex flex-wrap items-center justify-between gap-8">
              {/* cart details */}
              <div className="flex flex-wrap gap-8">
                <span className="font-medium">
                  {size ? formatNumber(size) : 0} items
                </span>
              </div>

              {/* cart actions */}
              <div className="flex flex-wrap gap-4">
                {!shared && <Clear size={size} />}

                {!shared && (
                  <Dialog
                    title="Share Cart"
                    content={
                      <>
                        {showStatus({ query: shareMutation }) ? (
                          <Status query={shareMutation} />
                        ) : shareLink ? (
                          <>
                            <div className="flex flex-col gap-4">
                              <p>Cart saved to</p>
                              <Textbox
                                readOnly
                                value={String(shareLink)}
                                onFocus={(event) => event.target.select()}
                              />
                              <div className="flex flex-wrap items-center gap-4">
                                <ActionButton
                                  onClick={() => copy(String(shareLink))}
                                >
                                  <Clipboard />
                                  Copy
                                </ActionButton>
                                <Button
                                  to={`mailto:?body=${encodeURIComponent(String(shareLink))}`}
                                >
                                  <Mail />
                                  Email
                                </Button>
                                <Button to={shareLink.pathname}>
                                  <ArrowRight />
                                  View
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-4">
                              <p>Start fresh cart</p>
                              <Clear size={size} />
                            </div>
                          </>
                        ) : (
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

                {cart && (
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
                      title="Export to Refine.bio"
                      content={
                        <>
                          {showStatus({ query: refineBioMutation }) ? (
                            <Status query={refineBioMutation} />
                          ) : refineBioLink ? (
                            <>
                              <p>Cart exported to</p>
                              <Textbox
                                readOnly
                                value={String(refineBioLink)}
                                onFocus={(event) => event.target.select()}
                              />
                              <div className="flex flex-wrap items-center gap-4">
                                <ActionButton
                                  onClick={() => copy(String(refineBioLink))}
                                >
                                  <Clipboard />
                                  Copy
                                </ActionButton>
                                <Button
                                  to={`mailto:?body=${encodeURIComponent(String(refineBioLink))}`}
                                >
                                  <Mail />
                                  Email
                                </Button>
                                <Button to={String(refineBioLink)}>
                                  <ArrowRight />
                                  View
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                Export supported studies in this cart to a
                                Refine.bio dataset
                              </div>
                              <Textbox
                                placeholder="Email (optional)"
                                value={userEmail}
                                onChange={setUserEmail}
                              />
                              <Button
                                onClick={() => refineBioMutation.mutate()}
                              >
                                <LinkIcon />
                                Export
                              </Button>
                            </>
                          )}
                        </>
                      }
                    >
                      <Button aria-disabled={!size}>
                        <SquareArrowRightEnter />
                        Refine.bio
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
              <div className="flex flex-col items-center gap-8">
                <div>No studies yet</div>
                <Button to="/">
                  <Plus />
                  Search
                </Button>
              </div>
            )}

            <Status
              query={studyBatchLookupQuery}
              loading={`Loading ${studyIds.length} studies`}
            />

            {!!studyDetails.length && (
              <>
                <Table
                  cols={[
                    {
                      key: "id",
                      name: "ID",
                    },
                    {
                      key: "name",
                      name: "Name",
                    },
                    {
                      key: "sample_count",
                      name: "Samples",
                    },
                    {
                      key: "submitted_at",
                      name: "Date",
                      render: (date) => <Ago date={date} />,
                    },
                    {
                      key: "database",
                      name: "Databases",
                      render: (database) =>
                        database.map((database, index) => (
                          <DatabaseBadge key={index} database={database} />
                        )),
                    },
                    {
                      key: "added",
                      name: "Added",
                      render: (added) => <Ago date={added} />,
                    },
                    {
                      key: "id",
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
                      localCart?.studies.find((s) => s.id === study.id)
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
              Carts you've created on this device
            </p>

            <div
              className={clsx(
                "grid max-w-max gap-8 self-center",
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
                    flex flex-col items-start gap-4 rounded-sm p-4 shadow-md
                  "
                >
                  <strong>{name || id}</strong>
                  <span>{formatNumber(studies.length)} studies</span>
                </Link>
              ))}
            </div>

            <br />

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
