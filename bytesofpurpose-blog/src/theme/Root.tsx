import React from 'react';
import DebugMenu from '@site/src/components/DebugMenu';
import ToastHost from '@site/src/components/Toast';

// Swizzled @theme/Root — wraps the entire app (above the router, persists across
// navigation). The default Root just renders its children; we additionally mount
// the floating DebugMenu (self-gates to localhost + dev builds — a no-op in prod)
// and the app-wide ToastHost (renders iOS-style slide-in toasts on demand).
export default function Root({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <>
      {children}
      <DebugMenu />
      <ToastHost />
    </>
  );
}
