import type { ReactNode } from 'react';

interface MobileShellProps {
  topBar?: ReactNode;
  children: ReactNode;
  formatBar?: ReactNode;
  bottomNav?: ReactNode;
}

export function MobileShell({ topBar, children, formatBar, bottomNav }: MobileShellProps) {
  return (
    <div className="mobile-shell">
      {topBar}
      <div className="mobile-shell__content">{children}</div>
      {formatBar}
      {bottomNav}
    </div>
  );
}
