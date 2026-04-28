"use client";

import { createContext, useContext, useState } from "react";

interface AlertCountContextValue {
  totalAlertCount: number;
  setTotalAlertCount: (n: number) => void;
}

const AlertCountContext = createContext<AlertCountContextValue>({
  totalAlertCount: 0,
  setTotalAlertCount: () => {},
});

export function AlertCountProvider({ children }: { children: React.ReactNode }) {
  const [totalAlertCount, setTotalAlertCount] = useState(0);
  return (
    <AlertCountContext.Provider value={{ totalAlertCount, setTotalAlertCount }}>
      {children}
    </AlertCountContext.Provider>
  );
}

export function useAlertCount() {
  return useContext(AlertCountContext);
}
