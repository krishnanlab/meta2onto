import type { ReactElement, ReactNode } from "react";
import { Tooltip as _Tooltip } from "@base-ui-components/react/tooltip";
import { Arrow, offset, padding } from "@/components/Popover";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export default function Tooltip({ children, content }: Props) {
  return (
    <_Tooltip.Provider>
      <_Tooltip.Root delay={100}>
        <_Tooltip.Trigger render={children} />
        <_Tooltip.Portal>
          <_Tooltip.Positioner
            sideOffset={offset}
            collisionPadding={padding}
            className="z-20"
          >
            <_Tooltip.Popup className="flex w-50 max-w-max flex-col gap-2 rounded bg-slate-900 p-2 leading-none text-white">
              <_Tooltip.Arrow className="text-slate-900 data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=top]:top-full">
                <Arrow />
              </_Tooltip.Arrow>
              {content}
            </_Tooltip.Popup>
          </_Tooltip.Positioner>
        </_Tooltip.Portal>
      </_Tooltip.Root>
    </_Tooltip.Provider>
  );
}
