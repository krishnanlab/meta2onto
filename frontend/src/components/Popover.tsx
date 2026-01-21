import type { ReactElement, ReactNode } from "react";
import { Popover as _Popover } from "@base-ui/react";
import { Arrow, offset, padding } from "@/components/Tooltip";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export default function Popover({ children, content }: Props) {
  return (
    <_Popover.Root>
      <_Popover.Trigger render={children} />
      <_Popover.Portal>
        <_Popover.Positioner sideOffset={offset} collisionPadding={padding}>
          <_Popover.Popup
            className="
              flex flex-col gap-2 rounded-sm bg-white p-2 leading-none
              text-white shadow-overlay
            "
          >
            <_Popover.Arrow
              className="
                text-white
                data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180
                data-[side=top]:top-full
              "
            >
              <Arrow />
            </_Popover.Arrow>
            {content}
          </_Popover.Popup>
        </_Popover.Positioner>
      </_Popover.Portal>
    </_Popover.Root>
  );
}
