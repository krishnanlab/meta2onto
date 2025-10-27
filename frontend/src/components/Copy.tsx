import { useState } from "react";
import { useDebounceFn } from "@reactuses/core";
import { Check, ClipboardCopy } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  content: string;
};

const Copy = ({ content }: Props) => {
  const [copied, setCopied] = useState(false);

  const done = useDebounceFn(() => setCopied(false), 2000);

  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        done.run();
      }}
    >
      {copied ? (
        <>
          <Check />
          Copied
        </>
      ) : (
        <>
          <ClipboardCopy />
          <>Copy</>
        </>
      )}
    </Button>
  );
};

export default Copy;
