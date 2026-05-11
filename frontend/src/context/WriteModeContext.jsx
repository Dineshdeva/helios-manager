/**
 * WriteModeContext — global write-mode toggle.
 *
 * Write mode is OFF by default. The user must explicitly enable it via the
 * sidebar toggle. Once enabled, create/edit buttons become visible and every
 * mutation shows a confirmation dialog before proceeding.
 *
 * The BFF independently enforces ENABLE_WRITE_OPS=true; this context only
 * controls frontend visibility of write controls.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { getWriteEnabled } from '../services/api';

const WriteModeContext = createContext({
  writeMode: false,
  setWriteMode: () => {},
  serverWriteEnabled: false,
});

export function WriteModeProvider({ children }) {
  const [writeMode, setWriteMode] = useState(false);
  const [serverWriteEnabled, setServerWriteEnabled] = useState(false);

  useEffect(() => {
    getWriteEnabled()
      .then((d) => setServerWriteEnabled(d.enabled === true))
      .catch(() => setServerWriteEnabled(false));
  }, []);

  return (
    <WriteModeContext.Provider value={{ writeMode, setWriteMode, serverWriteEnabled }}>
      {children}
    </WriteModeContext.Provider>
  );
}

export function useWriteMode() {
  return useContext(WriteModeContext);
}
