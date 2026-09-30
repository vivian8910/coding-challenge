import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const getNavLinkClassName = (isActive: boolean): string =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const navLinkClassName = ({ isActive }: { isActive: boolean }): string => getNavLinkClassName(isActive);

/**
 * Shared page shell: header with primary navigation, and a content area for
 * the routed page. Used by `App` to wrap every route.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <span className="mr-4 text-lg font-semibold">SEC EDGAR Filing Explorer</span>
          <NavLink to="/" end className={navLinkClassName}>
            Home
          </NavLink>
          <NavLink to="/companies" end className={navLinkClassName}>
            Companies
          </NavLink>
          <NavLink to="/summary" className={navLinkClassName}>
            Summary
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
};
