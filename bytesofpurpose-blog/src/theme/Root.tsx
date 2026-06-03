import React from 'react';
import DebugMenu from '@site/src/components/DebugMenu';
import ToastHost from '@site/src/components/Toast';
import SignInModalHost from '@site/src/components/SignInModal';
import {AuthProvider} from '@site/src/lib/auth';

// Swizzled @theme/Root: wraps the entire app (above the router, persists across
// navigation). The default Root just renders its children; we additionally:
//   - provide AuthProvider so the navbar auth control, the premium page gate,
//     the <Premium> block, and the sign-in modal share ONE /api/me fetch (it
//     lives above the router, so the request fires once per session, not per
//     navigation);
//   - mount the floating DebugMenu (self-gates to localhost + dev builds, a
//     no-op in prod) and the app-wide ToastHost (iOS-style slide-in toasts).
export default function Root({children}: {children: React.ReactNode}): React.JSX.Element {
  return (
    <AuthProvider>
      {children}
      <DebugMenu />
      <ToastHost />
      <SignInModalHost />
    </AuthProvider>
  );
}
