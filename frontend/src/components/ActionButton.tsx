import type { ReactNode } from "react";
import { useState } from "react";
import { useDebounceFn } from "@reactuses/core";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  onClick: () => Promise<unknown>;
  running?: ReactNode;
  success?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

/** copy text to clipboard */
export const copy = (content: string) => navigator.clipboard.writeText(content);

/** button that does async action on click and shows status */
export default function ActionButton({
  onClick,
  running = (
    <>
      <Loader2 className="animate-spin" />
      Loading
    </>
  ),
  success = (
    <>
      <Check />
      Success
    </>
  ),
  error = (
    <>
      <TriangleAlert />
      Error
    </>
  ),
  children,
}: Props) {
  const [status, setStatus] = useState<"" | "running" | "success" | "error">(
    "",
  );

  const reset = useDebounceFn(() => setStatus(""), 2000);

  return (
    <Button
      onClick={async () => {
        setStatus("running");
        try {
          await onClick();
          setStatus("success");
        } catch {
          setStatus("error");
        }
        reset.run();
      }}
    >
      {status === "" && children}
      {status === "running" && running}
      {status === "success" && success}
      {status === "error" && error}
    </Button>
  );
}
