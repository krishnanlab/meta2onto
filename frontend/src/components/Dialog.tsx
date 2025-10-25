import type { ReactElement, ReactNode } from "react";
import { Dialog as _Dialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";

type Props = {
  title: ReactNode;
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
};

const Dialog = ({ title, content, children }: Props) => {
  return (
    <_Dialog.Root>
      <_Dialog.Trigger render={children} />
      <_Dialog.Portal>
        <_Dialog.Backdrop className="fixed inset-0 z-10 bg-black/50" />
        <_Dialog.Popup className="pointer-events-none fixed inset-0 z-20 grid place-items-center p-4">
          <div className="pointer-events-auto flex max-h-full min-h-0 flex-col gap-4 rounded bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <_Dialog.Title className="flex flex-col items-start! gap-1 text-left! leading-none">
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
};

export default Dialog;
