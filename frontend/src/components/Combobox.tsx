import type { ComponentProps } from "react";
import { Fragment } from "react";
import { Combobox as _Combobox } from "@base-ui/react";
import { Check, X } from "lucide-react";

type Props<O extends Option> = {
  options: readonly O[];
  placeholder?: string;
  value?: O[];
  onChange?: (value: O[]) => void;
} & Omit<ComponentProps<"div">, "value" | "onChange">;

export type Option<Value = string> = Value;

export default function ComboBox<O extends Option>({
  options,
  placeholder = "Search",
  value,
  onChange,
}: Props<O>) {
  return (
    <_Combobox.Root
      items={options}
      multiple
      value={value}
      onValueChange={onChange}
    >
      <_Combobox.Value>
        {(value: O[]) => (
          <Fragment>
            <_Combobox.Chips className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <_Combobox.Chip key={index}>
                  <_Combobox.ChipRemove className="flex items-center gap-1 rounded-full bg-theme-light px-2 py-1 text-sm transition hover:bg-stone-200">
                    {item} <X />
                  </_Combobox.ChipRemove>
                </_Combobox.Chip>
              ))}
            </_Combobox.Chips>
            <_Combobox.InputGroup className="flex">
              <_Combobox.Input
                placeholder={placeholder}
                className="grow rounded-md border border-current/25 bg-white p-2"
              />
            </_Combobox.InputGroup>
          </Fragment>
        )}
      </_Combobox.Value>

      <_Combobox.Portal>
        <_Combobox.Positioner className="z-10" collisionPadding={40}>
          <_Combobox.Popup className="flex max-h-(--available-height) w-(--anchor-width) flex-col overflow-y-auto rounded-md bg-white shadow-md">
            <_Combobox.Empty>
              <div>No results</div>
            </_Combobox.Empty>
            <_Combobox.List>
              {(item: O) => (
                <_Combobox.Item
                  key={item}
                  value={item}
                  className="flex cursor-pointer items-center gap-2 p-1 transition hover:bg-stone-100 data-highlighted:bg-stone-100 data-selected:[&>svg]:opacity-100"
                >
                  <Check className="text-emerald-500 opacity-0 transition" />
                  <span>{item}</span>
                </_Combobox.Item>
              )}
            </_Combobox.List>
          </_Combobox.Popup>
        </_Combobox.Positioner>
      </_Combobox.Portal>
    </_Combobox.Root>
  );
}
