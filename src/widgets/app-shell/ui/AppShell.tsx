import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './AppShell.module.css';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Vacatures', to: '/vacancies/new' },
  { label: 'Kandidaten', to: '/candidates' },
  { label: 'Statistieken', to: '/statistics' },
];

const activeLabel = 'Vacatures';

/**
 * Design note: the account-menu's actual destinations were never observed (per
 * open-questions.md #6) — this renders a static, non-functional list rather than
 * inventing routes.
 */
const accountMenuItems = ['Account', 'Instellingen', 'Support'];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>Jobzy</div>
          <nav aria-label="Hoofdnavigatie" className={styles.nav}>
            {navItems.map((item) => {
              const isActive = item.label === activeLabel;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={styles.navItem}
                  data-active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.account}>
            <span className={styles.avatar}>MJ</span>
            <ul className={styles.accountMenu} role="menu" aria-label="Accountmenu">
              {accountMenuItems.map((label) => (
                <li key={label} role="menuitem" className={styles.accountMenuItem}>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
