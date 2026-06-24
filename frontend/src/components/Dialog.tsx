import type { ReactElement, ReactNode } from "react";
import { Dialog as _Dialog } from "@base-ui/react";
import { X } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  title: ReactNode;
  subtitle?: ReactNode;
  content: ReactNode;
  bottom?: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Dialog({
  children,
  title,
  subtitle,
  content,
  bottom,
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
        <_Dialog.Popup className="pointer-events-none fixed inset-0 z-20 grid place-items-center p-12">
          <div className="pointer-events-auto flex max-h-full min-h-0 max-w-full min-w-0 flex-col rounded-md bg-white *:px-4 *:py-2">
            <div className="flex items-start gap-4 shadow-md">
              <div className="flex grow flex-col justify-start">
                <_Dialog.Title className="justify-start text-left">
                  {title}
                </_Dialog.Title>
                {subtitle && (
                  <_Dialog.Description className="text-stone-500">
                    {subtitle}
                  </_Dialog.Description>
                )}
              </div>
              <_Dialog.Close render={<Button color="none" />}>
                <X />
              </_Dialog.Close>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto">{content}</div>
            {bottom && (
              <div className="flex flex-wrap gap-4 shadow-md">{bottom}</div>
            )}
          </div>
        </_Dialog.Popup>
      </_Dialog.Portal>
    </_Dialog.Root>
  );
}
