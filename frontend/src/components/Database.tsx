import { dbLink, getDb } from "@/api/api";
import Link from "@/components/Link";
import Pill from "@/components/Pill";

type Props = {
  /** study id */
  study?: string;
  /** database id */
  database: string;
};

/** pill for database info */
export default function Database({ study = "", database }: Props) {
  const { id = database, description = "", link = "" } = getDb(database);

  const tooltip = (
    <div className="flex flex-col items-start gap-2">
      <strong>{id}</strong>
      <div className="text-balance">{description}</div>
    </div>
  );

  return (
    <Link
      key={database}
      to={dbLink(link, study)}
      tabIndex={0}
      className="rounded-md bg-theme-light px-1 text-black"
    >
      <Pill value={database} tooltip={tooltip} />
    </Link>
  );
}
