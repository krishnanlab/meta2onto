import { databaseLink, databaseTooltip } from "@/api/maps";
import Link from "@/components/Link";
import Pill from "@/components/Pill";

type Props = {
  /** database id */
  database: string;
  /** study id */
  study?: string;
};

/** pill for database info */
export default function Database({ database, study = "" }: Props) {
  let link = databaseLink[database] ?? "";

  /** if study provided, insert */
  if (study) link = link.replace("$STUDY", study);
  /** else, remove between brackets (link to a more base page w/o search) */ else
    link = link.replace(/\[.*]/, "");

  return (
    <Link
      to={link}
      tabIndex={0}
      className="contents no-underline"
      arrow={false}
    >
      <Pill
        value={database}
        tooltip={{
          [database]: (
            <div className="flex flex-col items-start gap-2">
              <strong>{database}</strong>
              <div className="text-balance">{databaseTooltip[database]}</div>
            </div>
          ),
        }}
      />
    </Link>
  );
}
