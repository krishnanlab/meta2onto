import type { ReactElement, ReactNode } from "react";
import { Tooltip as _Tooltip } from "@base-ui-components/react/tooltip";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

const Tooltip = ({ children, content }: Props) => {
  return (
    <_Tooltip.Provider>
      <_Tooltip.Root delay={100}>
        <_Tooltip.Trigger render={children} />
        <_Tooltip.Portal>
          <_Tooltip.Positioner sideOffset={10}>
            <_Tooltip.Popup className="flex w-50 max-w-max flex-col gap-2 rounded bg-slate-900 p-2 leading-none text-white">
              <_Tooltip.Arrow className="data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=top]:top-full">
                <svg viewBox="-10 -10 20 10" width="10">
                  <path
                    d="M 0 0 L -10 -10 L 10 -10"
                    className="fill-slate-900"
                  />
                </svg>
              </_Tooltip.Arrow>
              {content}
            </_Tooltip.Popup>
          </_Tooltip.Positioner>
        </_Tooltip.Portal>
      </_Tooltip.Root>
    </_Tooltip.Provider>
  );
};

export default Tooltip;
