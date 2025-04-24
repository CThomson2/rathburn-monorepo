
import { useEffect, useState, useRef } from 'react';

/**
 * 1. The hook takes two parameters:
 *    - `items`: An array of items of generic type T
 *    - `onSelect`: A callback function that is triggered when an item is selected
 * 
 * 2. It sets up state and refs:
 *    - `activeIndex`: Tracks which item is currently active in the list (starts at -1, meaning no selection)
 *    - `itemRefs`: A ref that stores references to the DOM elements for each item in the list
 * 
 * 3. The main effect:
 *    - Resets the refs array when items change
 *    - Sets up keyboard event listeners for:
 *      - `ArrowDown`: Moves selection down (with wraparound)
 *      - `ArrowUp`: Moves selection up (with wraparound)
 *      - `Enter`: Calls the onSelect callback with the currently selected item
 *    - Cleans up event listeners on unmount
 * 
 * 4. Returns:
 *    - `activeIndex`: The current active item index
 *    - `registerRef`: A function to register DOM refs for each item
 * 
 * The hook provides keyboard navigation capabilities to any list of items in a React component. When used, it allows users to navigate through items with arrow keys and select an item with Enter, while properly focusing the active element.
 * 
 * I'll create a comprehensive documentation for this hook that explains its purpose, parameters, return values, and typical usage patterns.</think># `useKeyboardNavigation` Hook Documentation
 * 
 * This custom React hook provides keyboard navigation functionality for lists, enabling users to navigate through items using arrow keys and select them with the Enter key.
 * 
 * ## Overview
 * 
 * The `useKeyboardNavigation` hook manages keyboard navigation for any list of items in a React component. It tracks the currently active item, handles keyboard events for navigation, and manages focus between list items automatically.
 * 
 * ## Parameters
 * 
 * - `items: T[]` - An array of items of any type to navigate through
 * - `onSelect: (item: T, index: number) => void` - Callback function triggered when an item is selected
 * 
 * ## Return Values
 * 
 * The hook returns an object with:
 * 
 * - `activeIndex: number` - The index of the currently active item (-1 if none selected)
 * - `registerRef: (index: number, element: HTMLElement | null) => void` - Function to register DOM references for each item
 * 
 * ## How It Works
 * 
 * 1. The hook initializes with no active item (`activeIndex = -1`) and creates a ref array to store DOM references to each list item.
 * 
 * 2. It sets up keyboard event listeners for:
 *    - **Arrow Down**: Moves selection to the next item (wraps to first item after last)
 *    - **Arrow Up**: Moves selection to the previous item (wraps to last item from first)
 *    - **Enter**: Triggers the `onSelect` callback with the currently active item
 * 
 * 3. When navigation occurs, the hook automatically:
 *    - Updates the `activeIndex` state
 *    - Focuses the corresponding DOM element
 *    - Handles edge cases like wrapping around the list
 * 
 * 4. The `registerRef` function allows the parent component to associate DOM elements with each item in the list.
 * 
 * ## Usage Example
 * 
 * ```tsx
 * function ItemList({ items }) {
 *   const handleSelect = (item, index) => {
 *     console.log(`Selected item: ${item} at index ${index}`);
 *   };
 * 
 *   const { activeIndex, registerRef } = useKeyboardNavigation(items, handleSelect);
 * 
 *   return (
 *     <ul>
 *       {items.map((item, index) => (
 *         <li
 *           key={index}
 *           ref={(el) => registerRef(index, el)}
 *           tabIndex={0}
 *           className={index === activeIndex ? 'active' : ''}
 *         >
 *           {item}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * 
 * @param items 
 * @param onSelect 
 * @returns 
 */
export function useKeyboardNavigation<T>(items: T[], onSelect: (item: T, index: number) => void) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Reset the refs array when items change
    itemRefs.current = itemRefs.current.slice(0, items.length);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => {
            const nextIndex = prev < items.length - 1 ? prev + 1 : 0;
            itemRefs.current[nextIndex]?.focus();
            return nextIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : items.length - 1;
            itemRefs.current[nextIndex]?.focus();
            return nextIndex;
          });
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < items.length) {
            onSelect(items[activeIndex] as T, activeIndex);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, activeIndex, onSelect]);

  // Function to register a ref for an item
  const registerRef = (index: number, element: HTMLElement | null) => {
    itemRefs.current[index] = element;
  };

  return { activeIndex, registerRef };
}
