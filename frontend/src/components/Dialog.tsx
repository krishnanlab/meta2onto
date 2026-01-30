import type { ReactElement, ReactNode } from "react";
import { Dialog as _Dialog } from "@base-ui/react";
import { X } from "lucide-react";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  title: ReactNode;
  subtitle?: ReactNode;
  content: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Dialog({
  children,
  title,
  subtitle,
  content,
  onOpen,
  onClose,
}: Props) {
  /** prevent if trigger disabled */
  if (children.props["aria-disabled"]) return children;

  return (
    <_Dialog.Root onOpenChange={(open) => (open ? onOpen?.() : onClose?.())}>
      <_Dialog.Trigger render={children} />
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
            <div className="flex items-start gap-4">
              <div className="flex grow flex-col justify-start">
                <_Dialog.Title className="justify-start text-left">
                  {title}
                </_Dialog.Title>
                {subtitle && (
                  <_Dialog.Description className="text-sm text-slate-500">
                    {subtitle}
                  </_Dialog.Description>
                )}
              </div>
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
