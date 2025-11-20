import type { ReactElement, ReactNode } from "react";
import { Popover as _Popover } from "@base-ui-components/react/popover";

type Props = {
  trigger: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export const offset = 5;
export const padding = 20;

export default function Popover({ trigger, content }: Props) {
  return (
    <_Popover.Root>
      <_Popover.Trigger render={trigger} />
      <_Popover.Portal>
        <_Popover.Positioner sideOffset={offset} collisionPadding={padding}>
          <_Popover.Popup
            className={`
              flex flex-col gap-2 rounded-sm bg-white p-2 leading-none
              text-white shadow-overlay
            `}
          >
            <_Popover.Arrow
              className={`
                text-white
                data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180
                data-[side=top]:top-full
              `}
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

const size = 2 * offset;

export const Arrow = () => (
  <svg viewBox={[-size, -size, 2 * size, 2 * size].join(" ")} width={size}>
    <path
      d={`M 0 0 L -${size} -${size} L ${size} -${size}`}
      className="fill-current"
    />
  </svg>
);
