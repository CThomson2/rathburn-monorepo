import * as React from "react";

/**
 * React hook for managing a boolean disclosure state.
 *
 * @param {boolean} [initial=false] - The initial state of the disclosure.
 *
 * @returns An object with the following properties:
 *   isOpen: boolean - The current state of the disclosure
 *   open(): void - Opens the disclosure
 *   close(): void - Closes the disclosure
 *   toggle(): void - Toggles the disclosure
 */
export const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = React.useState(initial);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((state) => !state), []);

  return { isOpen, open, close, toggle };
};
