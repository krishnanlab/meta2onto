import type { ReactElement, ReactNode } from "react";
import { Popover } from "@base-ui-components/react/popover";

type Props = {
  trigger: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export const offset = 10;
export const padding = 20;

export default function ({ trigger, content }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger render={trigger} />
      <Popover.Portal>
        <Popover.Positioner sideOffset={offset} collisionPadding={padding}>
          <Popover.Popup className="shadow-overlay flex flex-col gap-2 rounded bg-white p-2 leading-none text-white">
            <Popover.Arrow className="data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=top]:top-full">
              <Arrow />
            </Popover.Arrow>
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const size = offset / 2;

export const Arrow = () => (
  <svg viewBox={[-size, -size, 2 * size, 2 * size].join(" ")} width={size}>
    <path
      d={`M 0 0 L -${size} -${size} L ${size} -${size}`}
      className="fill-current"
    />
  </svg>
);
