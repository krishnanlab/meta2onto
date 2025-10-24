import { useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { Autocomplete as _Autocomplete } from "@base-ui-components/react/autocomplete";
import clsx from "clsx";
import { Search } from "lucide-react";
import Textbox from "@/components/Textbox";

type Props = {
  /** search value */
  search: string;
  /** on input search */
  setSearch: (search: string) => void;
  /** search placeholder text */
  placeholder: string;
  /** dropdown options */
  options: {
    id: string;
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
const Autocomplete = ({
  search,
  setSearch,
  options,
  onSelect,
  placeholder,
  status,
  className,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <_Autocomplete.Root
      value={search}
      onValueChange={setSearch}
      items={options}
      mode="none"
      openOnInputClick
    >
      <div className="relative flex items-center">
        <_Autocomplete.Input
          render={
            <Textbox
              ref={inputRef}
              placeholder={placeholder}
              className={clsx("w-full", className)}
            />
          }
        />
        <Search className="text-theme absolute right-0 px-2" />
      </div>

      <_Autocomplete.Portal>
        <_Autocomplete.Positioner sideOffset={2}>
          <_Autocomplete.Popup className="shadow-overlay flex max-h-(--available-height) w-(--anchor-width) flex-col overflow-y-auto rounded bg-white">
            {status && (
              <_Autocomplete.Status className="flex gap-2 p-2 leading-none">
                {status}
              </_Autocomplete.Status>
            )}
            {!status && (
              <_Autocomplete.List>
                {(tag: (typeof options)[number]) => (
                  <_Autocomplete.Item
                    key={tag.id}
                    value={tag.id}
                    className="data-highlighted:bg-theme/10 flex cursor-pointer gap-2 p-2 leading-none"
                    onClick={() => {
                      /** select option */
                      onSelect?.(tag.id);
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
};

export default Autocomplete;
