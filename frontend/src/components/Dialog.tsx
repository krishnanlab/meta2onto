import type { ReactElement, ReactNode } from "react";
import { Dialog as _Dialog } from "@base-ui/react";
import { X } from "lucide-react";

type Props = {
  trigger: ReactElement<Record<string, unknown>>;
  title: ReactNode;
  content: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Dialog({
  trigger,
  title,
  content,
  onOpen,
  onClose,
}: Props) {
  return (
    <_Dialog.Root onOpenChange={(open) => (open ? onOpen?.() : onClose?.())}>
      <_Dialog.Trigger render={trigger} />
      <_Dialog.Portal>
        <_Dialog.Backdrop className="fixed inset-0 z-10 bg-black/50" />
        <_Dialog.Popup
          className="
            pointer-events-none fixed inset-0 z-20 grid place-items-center p-4
          "
        >
          <div
            className="
              pointer-events-auto flex max-h-full min-h-0 max-w-full min-w-0
              flex-col gap-4 rounded-sm bg-white p-4
            "
          >
            <div className="flex items-start justify-between gap-4">
              <_Dialog.Title
                className="
                  flex flex-col items-start! gap-1 text-left! leading-none
                "
              >
                {title}
              </_Dialog.Title>
              <_Dialog.Close>
                <X />
              </_Dialog.Close>
            </div>
            {content}
          </div>
        </_Dialog.Popup>
      </_Dialog.Portal>
    </_Dialog.Root>
  );
}
