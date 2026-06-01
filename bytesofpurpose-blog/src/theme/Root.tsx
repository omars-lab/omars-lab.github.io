import React from 'react';
import DebugMenu from '@site/src/components/DebugMenu';

// Swizzled @theme/Root — wraps the entire app (above the router, persists across
// navigation). The default Root just renders its children; we additionally mount
// the floating DebugMenu, which self-gates to localhost + dev builds (renders
// null otherwise), so this is a no-op in production.
export default function Root({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <>
      {children}
      <DebugMenu />
    </>
  );
}
