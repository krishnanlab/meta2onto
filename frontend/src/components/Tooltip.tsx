import type { ReactElement, ReactNode } from "react";
import { Tooltip as _Tooltip } from "@base-ui-components/react/tooltip";
import { renderText } from "@/util/dom";

type Props = {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
};

export const offset = 5;
export const padding = 20;

export default function Tooltip({ children, content }: Props) {
  return (
    <_Tooltip.Provider>
      <_Tooltip.Root delay={100}>
        <_Tooltip.Trigger render={children} aria-label={renderText(content)} />
        <_Tooltip.Portal>
          <_Tooltip.Positioner
            sideOffset={offset}
            collisionPadding={padding}
            className="z-20"
          >
            <_Tooltip.Popup
              className="
                flex w-50 max-w-max flex-col gap-2 rounded-sm bg-slate-900 p-2
                leading-none text-white
              "
            >
              <_Tooltip.Arrow
                className="
                  text-slate-900
                  data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180
                  data-[side=top]:top-full
                "
              >
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

const size = 2 * offset;

export const Arrow = () => (
  <svg viewBox={[-size, -size, 2 * size, 2 * size].join(" ")} width={size}>
    <path
      d={`M 0 0 L -${size} -${size} L ${size} -${size}`}
      className="fill-current"
    />
  </svg>
);
