import type { ReactElement, ReactNode, RefObject } from "react";
import { useRef } from "react";
import { Autocomplete as _Autocomplete } from "@base-ui/react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { padding } from "@/components/Tooltip";

type Props = {
  /** optional input ref */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** search value */
  search: string;
  /** on input search */
  setSearch: (search: string) => void;
  /** search placeholder text */
  placeholder: string;
  /** dropdown options */
  options: {
    value: string;
    content: ReactElement<{ className?: string }>;
  }[];
  /** on option select */
  onSelect?: (value: string | null) => void;
  /** "status" row */
  status?: ReactNode;
  /** input styles */
  className?: string;
};

/** textbox box with dropdown */
export default function Autocomplete({
  inputRef,
  search,
  setSearch,
  options,
  onSelect,
  placeholder,
  status,
  className,
}: Props) {
  const _inputRef = useRef<HTMLInputElement>(null);
  inputRef ??= _inputRef;

  return (
    <_Autocomplete.Root
      value={search}
      onValueChange={setSearch}
      items={options}
      mode="none"
      openOnInputClick
    >
      <div className={clsx("relative flex items-center", className)}>
        <_Autocomplete.Input
          render={
            <input
              ref={inputRef}
              placeholder={placeholder}
              className="
                w-full rounded-sm border border-current/25 bg-white p-2 pr-8
              "
            />
          }
        />
        <Search className="absolute right-0 px-2 text-theme" />
      </div>

      <_Autocomplete.Portal>
        <_Autocomplete.Positioner collisionPadding={padding}>
          <_Autocomplete.Popup
            className="
              flex max-h-(--available-height) w-(--anchor-width) grow flex-col
              overflow-y-auto rounded-sm bg-white shadow-thick
            "
          >
            {status && (
              <_Autocomplete.Status className="flex items-center gap-2 p-2">
                {status}
              </_Autocomplete.Status>
            )}
            {!status && (
              <_Autocomplete.List>
                {(tag: (typeof options)[number], index: number) => (
                  <_Autocomplete.Item
                    key={index}
                    value={tag.value}
                    className="
                      flex cursor-pointer items-center gap-2 p-2
                      data-highlighted:bg-theme/10
                    "
                    onClick={(event) => {
                      event.preventDefault();
                      /** select option */
                      onSelect?.(tag.value);
                      /** close dropdown */
                      inputRef.current?.blur();
                    }}
                  >
                    {tag.content}
                  </_Autocomplete.Item>
                )}
              </_Autocomplete.List>
            )}
          </_Autocomplete.Popup>
        </_Autocomplete.Positioner>
      </_Autocomplete.Portal>
    </_Autocomplete.Root>
  );
}
