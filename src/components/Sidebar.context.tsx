import { createContext } from 'react';

export const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}>({
  isOpen: true,
  setIsOpen: () => {},
});
