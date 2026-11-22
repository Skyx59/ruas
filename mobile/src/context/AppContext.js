import { createContext, useState } from 'react';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);

  return (
    <AppContext.Provider value={{ session, setSession }}>
      {children}
    </AppContext.Provider>
  );
}
