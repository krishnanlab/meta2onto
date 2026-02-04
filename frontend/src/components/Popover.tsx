import type { ReactElement, ReactNode } from "react";
import { useRef } from "react";
import { Popover as _Popover } from "@base-ui/react";
import { Arrow, offset, padding } from "@/components/Tooltip";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode | ((close: () => void) => ReactNode);
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Popover({ children, content, onOpen, onClose }: Props) {
  const actionsRef = useRef<_Popover.Root.Actions>(null);

  const close = () => actionsRef.current?.close();

  /** prevent if trigger disabled */
  if (children.props["aria-disabled"]) return children;

  return (
    <_Popover.Root
      actionsRef={actionsRef}
      onOpenChange={(open) => (open ? onOpen?.() : onClose?.())}
    >
      <_Popover.Trigger render={children} />
      <_Popover.Portal>
        <_Popover.Positioner
          side="top"
          sideOffset={offset}
          collisionPadding={padding}
          className="z-20"
        >
          <_Popover.Popup
            className="
              flex max-h-(--available-height) max-w-(--available-width) flex-col
              gap-2 rounded-sm bg-white p-4 shadow-overlay
            "
          >
            <_Popover.Arrow
              className="
                text-white
                data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180
                data-[side=left]:left-full data-[side=left]:-rotate-90
                data-[side=right]:right-full data-[side=right]:rotate-90
                data-[side=top]:top-full
              "
            >
              <Arrow />
            </_Popover.Arrow>
            {/* https://github.com/facebook/react/issues/34775 */}
            {/* eslint-disable-next-line react-hooks/refs */}
            {typeof content === "function" ? content(close) : content}
          </_Popover.Popup>
        </_Popover.Positioner>
      </_Popover.Portal>
    </_Popover.Root>
  );
}
