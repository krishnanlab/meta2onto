import type { ReactElement, ReactNode } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";

type Props = {
  trigger: ReactElement<Record<string, unknown>>;
  title: ReactNode;
  content: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function ({ trigger, title, content, onOpen, onClose }: Props) {
  return (
    <Dialog.Root onOpenChange={(open) => (open ? onOpen?.() : onClose?.())}>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-10 bg-black/50" />
        <Dialog.Popup className="pointer-events-none fixed inset-0 z-20 grid place-items-center p-4">
          <div className="pointer-events-auto flex max-h-full min-h-0 max-w-full min-w-0 flex-col gap-4 rounded bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="flex flex-col items-start! gap-1 text-left! leading-none">
                {title}
              </Dialog.Title>
              <Dialog.Close>
                <X />
              </Dialog.Close>
            </div>
            {content}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
