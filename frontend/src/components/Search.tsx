import {
  cloneElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Search as SearchIcon } from "lucide-react";

type Props = {
  /** search value */
  search: string;
  /** on input search */
  onSearch: (search: string) => void;
  /** search placeholder text */
  placeholder: string;
  /** dropdown options */
  options: {
    id: string;
    content: ReactElement<{ className?: string }>;
  }[];
  /** on option select */
  onSelect?: (value: string | null) => void;
  /** extra (non-selectable) rows at end of options list */
  extraRows?: ReactNode[];
};

/** search box with dropdown */
const Search = ({
  search,
  onSearch,
  options,
  onSelect,
  placeholder,
  extraRows,
}: Props) => {
  return (
    <Combobox
      value={""}
      onChange={(value) => onSelect?.(value)}
      onClose={() => onSearch("")}
      immediate
    >
      <div className="relative flex items-center">
        <ComboboxInput
          className="w-full rounded bg-white p-2 pr-8 leading-none"
          placeholder={placeholder}
          value={search}
          onChange={(event) => {
            const query = event.target.value;
            onSearch?.(query);
          }}
        />
        <SearchIcon className="text-theme absolute right-0 px-2" />
      </div>

      <ComboboxOptions
        anchor={{ to: "bottom", padding: 10 }}
        className="shadow-overlay flex w-(--input-width) flex-col rounded bg-white"
      >
        {options.map((option) => (
          <ComboboxOption as={Fragment} key={option.id} value={option.id}>
            {cloneElement(option.content, {
              className:
                "data-focus:bg-theme/10 flex cursor-pointer gap-2 p-2 leading-none",
            })}
          </ComboboxOption>
        ))}
        {extraRows?.filter(Boolean).map((row, index) => (
          <div key={index} className="flex gap-2 p-2 leading-none">
            {row}
          </div>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
};

export default Search;
