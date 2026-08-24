import { databaseLink, databaseTooltip } from "@/api/maps";
import Link from "@/components/Link";
import Pill from "@/components/Pill";

type Props = {
  /** database id */
  database: string;
  /** study id */
  study?: string;
  /** link to study in external database */
  link?: string;
  /** external study id in database */
  externalId?: string;
};

/** pill for database info */
export default function Database({
  database,
  study = "",
  link = "",
  externalId = "",
}: Props) {
  /** if manual link not provided */
  if (!link) {
    link = databaseLink[database] ?? "";
    /** if study provided, insert */
    if (study)
      link = link.replaceAll("$STUDY", study).replaceAll(/[\[\]]/g, "");
    /** otherwise, remove between brackets (link to a more base page w/o search) */ else
      link = link.replaceAll(/\[.*]/g, "");
  }

  return (
    <Link
      to={link}
      tabIndex={0}
      className="contents text-[unset]! no-underline"
      arrow={false}
    >
      <Pill
        value={database}
        color={{ default: "text-blue-500/25" }}
        tooltip={{
          default: (
            <div className="flex flex-col items-start gap-2">
              <strong>{database}</strong>
              {externalId}
              <div className="text-balance">{databaseTooltip[database]}</div>
            </div>
          ),
        }}
        hollow
      />
    </Link>
  );
}
