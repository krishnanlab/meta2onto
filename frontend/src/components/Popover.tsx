import type { ReactElement, ReactNode } from "react";
import { Popover as _Popover } from "@base-ui-components/react/popover";

type Props = {
  trigger: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

const Popover = ({ trigger, content }: Props) => {
  return (
    <_Popover.Root>
      <_Popover.Trigger render={trigger} />
      <_Popover.Portal>
        <_Popover.Positioner sideOffset={10}>
          <_Popover.Popup className="shadow-overlay flex flex-col gap-2 rounded bg-white p-2 leading-none text-white">
            <_Popover.Arrow className="data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=top]:top-full">
              <svg viewBox="-10 -10 20 10" width="10">
                <path d="M 0 0 L -10 -10 L 10 -10" className="fill-white" />
              </svg>
            </_Popover.Arrow>
            {content}
          </_Popover.Popup>
        </_Popover.Positioner>
      </_Popover.Portal>
    </_Popover.Root>
  );
};

export default Popover;
