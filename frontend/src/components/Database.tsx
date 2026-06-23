import type { ValueOf } from "type-fest";
import type { Study } from "@/api/types";
import { databaseTooltip } from "@/api/api";
import Link from "@/components/Link";
import Pill from "@/components/Pill";

type Props = {
  /** database id */
  id: string;
  /** database details */
  details: ValueOf<Study["database"]>;
};

/** pill for database info */
export default function Database({ id, details }: Props) {
  console.log(details.url);
  return (
    <Link
      key={id}
      to={details.url?.trim() ?? ""}
      tabIndex={0}
      className="contents no-underline"
      arrow={false}
    >
      <Pill
        value={id}
        tooltip={{
          [id]: (
            <div className="flex flex-col items-start gap-2">
              <strong>{id}</strong>
              <div className="text-balance">{databaseTooltip[id]}</div>
            </div>
          ),
        }}
      />
    </Link>
  );
}
