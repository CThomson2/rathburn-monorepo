import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Props for the Dropdown component.
 * @property {string} value - The currently selected value.
 * @property {(value: string) => void} onValueChange - Callback function to handle value changes.
 * @property {string[]} options - Array of options to display in the dropdown.
 * @property {string} [placeholder] - Placeholder text for the input field.
 * @property {string} [emptyMessage] - Message to display when no options are available.
 * @property {boolean} [disabled] - Whether the dropdown is disabled.
 * @property {(value: string) => void} [onInputChange] - Callback function to handle input changes.
 * @property {string} [heading] - Optional heading for the command group.
 * @property {boolean} [required] - Whether the dropdown selection is required.
 */
interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  onInputChange?: (value: string) => void;
  heading?: string;
  required?: boolean;
}

/**
 * Dropdown Component
 *
 * A reusable dropdown component that allows users to select from a list of options.
 * It includes a search input for filtering options and displays a message when no options are found.
 *
 * Note: Ensure that the `options` prop is always an array of strings for consistent behavior.
 *
 * @param {DropdownProps} props - The properties for the Dropdown component.
 * @returns {JSX.Element} The rendered Dropdown component.
 */
export const Dropdown = ({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  onInputChange,
  heading,
  required = false,
}: DropdownProps): JSX.Element => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Ensure we always have an array of valid strings
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.filter(
      (option): option is string =>
        typeof option === "string" && option !== null && option !== undefined
    );
  }, [options]);

  // Handle input changes and trigger API call
  const handleCommandInputChange = React.useCallback(
    (input: string) => {
      setInputValue(input);
      if (onInputChange) {
        onInputChange(input);
      }
    },
    [onInputChange]
  );

  // Handle selection of an option
  const handleSelect = React.useCallback(
    (selectedOption: string) => {
      onValueChange(selectedOption);
      setOpen(false);
      setInputValue("");
    },
    [onValueChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-background"
          aria-required={required}
        >
          <span className="truncate">
            {value || placeholder}
            {required && !value && (
              <span className="text-destructive ml-1">*</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleCommandInputChange}
            required={required}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup heading={heading}>
              {safeOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                >
                  {option}
                  {value === option && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
