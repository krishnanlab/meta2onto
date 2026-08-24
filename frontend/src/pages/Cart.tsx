import type { ColumnSort } from "@tanstack/react-table";
import type { Limit } from "@/components/Pagination";
import { useEffect, useState } from "react";
import analytics from "react-ga4";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { omit, sum, uniq } from "lodash";
import {
  ArrowRight,
  Braces,
  Clipboard,
  Download,
  LinkIcon,
  Mail,
  Search,
  Share2,
  SquareArrowRightEnter,
  Table2,
  Trash,
} from "lucide-react";
import { studyLookupCreate, useCartCreate, useCartRetrieve } from "@/api/query";
import { makeDataset } from "@/api/refine.bio";
import ActionButton, { copy } from "@/components/ActionButton";
import Ago from "@/components/Ago";
import Button from "@/components/Button";
import Database from "@/components/Database";
import Dialog from "@/components/Dialog";
import { H1, H2 } from "@/components/Heading";
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
import { downloadCsv, downloadJson, downloadTsv } from "@/util/download";
import { formatNumber } from "@/util/string";

export default function Cart() {
  /** local, current cart */
  const localCart = useAtomValue(cartAtom);

  /** cart id from url */
  const { id = "" } = useParams();

  /** is this a shared cart or local */
  const shared = !!id;

  /** look up study ids from cart id */
  const cartLookupQuery = useCartRetrieve(id, { query: { enabled: shared } });

  /** remote, shared cart */
  const sharedCart = cartLookupQuery.data?.data;

  /** current cart */
  const cart = localCart || sharedCart;

  /** cart study ids */
  const studyIds = (cart.studies || []).map((study) => study.id);

  /** cart size */
  const size = studyIds.length || 0;

  /** cart name */
  const name = cartLookupQuery.data?.data.name || id;

  /** custom cart name for sharing */
  const [shareName, setShareName] = useState(name);

  /** pagination */
  const [ordering, setOrdering] = useState<ColumnSort>({ id: "", desc: true });
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState<Limit>("10");

  /** look up study details from study ids */
  const studyBatchLookupQuery = useQuery({
    queryKey: ["studyBatchLookup", studyIds, offset, limit],
    queryFn: () =>
      studyLookupCreate({ ids: studyIds }, { offset, limit: Number(limit) }),
    enabled: !!size,
  });

  /** reset query state */
  const queryClient = useQueryClient();
  if (!size) queryClient.resetQueries({ queryKey: ["studyBatchLookup"] });

  /** full study details */
  const studyDetails = (studyBatchLookupQuery.data?.data.results || []).map(
    (study) => ({
      ...study,
      /** merge in any details from local cart */
      ...localCart?.studies.find((s) => !shared && s.id === study.id),
    }),
  );

  /** page title */
  const title = shared ? `Shared cart "${name}"` : `Data Cart`;

  /** share cart */
  const shareMutation = useCartCreate({
    mutation: {
      mutationKey: ["share-cart", localCart],
      onSuccess: (response) =>
        addCreatedCart({
          ...response.data,
          studies: [...response.data.studies],
        }),
    },
  });

  /** share cart result link */
  const shareLink =
    !shared && shareMutation.data
      ? new URL(`${window.location.origin}/cart/${shareMutation.data.data.id}`)
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
  const refineBioStudyIds = studyDetails.map(
    (study) => study.database["Refine.bio"]?.external_id ?? "",
  );

  /** total number of samples in refine.bio studies */
  const refineBioSamples = sum(
    studyDetails
      .filter((study) => "Refine.bio" in study.database)
      .map((study) => study.sample_count),
  );

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

  /** download cart in particular format */
  const downloadCart = (type: string) => {
    analytics.event("download_cart", studyDetails);

    const filename = name || "cart";

    if (type === "json")
      return downloadJson(
        studyDetails.map((study) => omit(study, ["feedback"])),
        filename,
      );

    /** unique list of databases */
    const databases = uniq(
      studyDetails.flatMap((study) => Object.keys(study.database)),
    );

    /** format data into table */
    const table = [
      [
        "ID",
        "Search",
        "Term",
        "Name",
        "Description",
        "Sample Count",
        "Confidence",
        "Platform",
        "Organisms",
        "Classification",
        ...databases.flatMap((database) => [
          `In ${database}`,
          `${database} ID`,
        ]),
      ],
      ...studyDetails.map((study) => [
        study.id,
        study.search,
        study.term,
        study.name,
        study.description,
        study.sample_count,
        study.confidence.name,
        study.platform?.join(", ") ?? "",
        study.organisms.join(", "),
        study.classification,
        ...databases.flatMap((database) => [
          study.database[database] ? "✓" : "✗",
          study.database[database]?.external_id || "",
        ]),
      ]),
    ];

    if (type === "csv") downloadCsv(table, filename);
    if (type === "tsv") downloadTsv(table, filename);
  };

  return (
    <>
      <Meta title={title} />

      <section className="bg-theme-light">
        <H1>{title}</H1>
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
                            <Button
                              onClick={() => {
                                analytics.event("share_cart", {
                                  name: shareName,
                                });
                                shareMutation.mutate({
                                  data: {
                                    name: shareName,
                                    studies: localCart?.studies ?? [],
                                  },
                                });
                              }}
                            >
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
                          <Button onClick={() => downloadCart("csv")}>
                            <Table2 />
                            CSV
                          </Button>

                          <Button onClick={() => downloadCart("tsv")}>
                            <Table2 />
                            TSV
                          </Button>

                          <Button onClick={() => downloadCart("json")}>
                            <Braces />
                            JSON
                          </Button>
                        </>
                      }
                    >
                      <Button aria-disabled={!size}>
                        <Download />
                        Download
                      </Button>
                    </Popover>

                    <Dialog
                      title="Cart to Refine.bio"
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
                              <p>
                                Export this cart to a Refine.bio dataset.
                                <br />
                                <strong>
                                  {formatNumber(refineBioStudyIds.length)}
                                </strong>{" "}
                                supported studies
                                <br />
                                <strong>
                                  {formatNumber(refineBioSamples)}
                                </strong>{" "}
                                supported samples
                              </p>

                              <Textbox
                                placeholder="Email (optional)"
                                value={userEmail}
                                onChange={setUserEmail}
                              />

                              {!refineBioSamples && <i>Nothing to export</i>}
                              <Button
                                onClick={() => refineBioMutation.mutate()}
                                aria-disabled={!refineBioSamples}
                              >
                                <SquareArrowRightEnter />
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
                  <Search />
                  Search
                </Button>
              </div>
            )}

            <Status
              query={studyBatchLookupQuery}
              loading={`Loading ${formatNumber(studyIds.length)} studies`}
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
                        Object.entries(database).map(
                          ([database, { url, external_id }], index) => (
                            <Database
                              key={index}
                              database={database}
                              link={url || ""}
                              externalId={external_id || ""}
                            />
                          ),
                        ),
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
                  rows={studyDetails}
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
            <H2>History</H2>

            <p className="self-center text-center">
              Carts you've shared from this device
            </p>

            <div
              className={clsx(
                "grid max-w-max gap-8 self-center",
                createdCarts.length === 1
                  ? "grid-cols-1"
                  : createdCarts.length === 2
                    ? "grid-cols-2 max-sm:grid-cols-1"
                    : "grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1",
              )}
            >
              {createdCarts.map(({ id, name, studies }, index) => (
                <Link
                  key={index}
                  to={`/cart/${id}`}
                  className="flex flex-col items-start gap-4 rounded-md p-4 shadow-md"
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
                  window.confirm("Clear created carts? No undo.") &&
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
type ClearProps = {
  size: number;
};

function Clear({ size }: ClearProps) {
  return (
    <Button
      color="accent"
      aria-disabled={!size}
      onClick={() => {
        if (window.confirm("Clear cart? No undo.")) clearCart();
      }}
    >
      <Trash />
      Clear
    </Button>
  );
}
