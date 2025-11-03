import { useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { Autocomplete } from "@base-ui-components/react/autocomplete";
import clsx from "clsx";
import { Search } from "lucide-react";
import { padding } from "@/components/Popover";

type Props = {
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
export default function ({
  search,
  setSearch,
  options,
  onSelect,
  placeholder,
  status,
  className,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Autocomplete.Root
      value={search}
      onValueChange={setSearch}
      items={options}
      mode="none"
      openOnInputClick
    >
      <div className="relative flex items-center">
        <Autocomplete.Input
          render={
            <input
              ref={ref}
              placeholder={placeholder}
              className={clsx(
                "w-full rounded border border-slate-300 p-2 leading-none disabled:border-0 disabled:bg-slate-200!",
                className,
              )}
            />
          }
        />
        <Search className="text-theme absolute right-0 px-2" />
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner collisionPadding={padding}>
          <Autocomplete.Popup className="shadow-thick flex max-h-(--available-height) w-(--anchor-width) flex-col overflow-y-auto rounded bg-white">
            {status && (
              <Autocomplete.Status className="flex gap-2 p-2 leading-none">
                {status}
              </Autocomplete.Status>
            )}
            {!status && (
              <Autocomplete.List>
                {(tag: (typeof options)[number], index: number) => (
                  <Autocomplete.Item
                    key={index}
                    value={tag.value}
                    className="data-highlighted:bg-theme/10 flex cursor-pointer gap-2 p-2 leading-none"
                    onClick={(event) => {
                      event.preventDefault();
                      /** select option */
                      onSelect?.(tag.value);
                      /** close dropdown */
                      ref.current?.blur();
                    }}
                  >
                    {tag.content}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            )}
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
