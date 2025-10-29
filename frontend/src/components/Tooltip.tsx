import type { ReactElement, ReactNode } from "react";
import { Tooltip } from "@base-ui-components/react/tooltip";
import { Arrow, offset, padding } from "@/components/Popover";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export default function ({ children, content }: Props) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delay={100}>
        <Tooltip.Trigger render={children} />
        <Tooltip.Portal>
          <Tooltip.Positioner
            sideOffset={offset}
            collisionPadding={padding}
            className="z-20"
          >
            <Tooltip.Popup className="flex w-50 max-w-max flex-col gap-2 rounded bg-slate-900 p-2 leading-none text-white">
              <Tooltip.Arrow className="data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=top]:top-full">
                <Arrow />
              </Tooltip.Arrow>
              {content}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
