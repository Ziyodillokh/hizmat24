import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { menuFor } from '@/lib/sections';
import { formatCountdown } from '@/lib/idle';
import { Notice, Pill } from '@/components/ui';
import { BrandMark } from '@/components/BrandMark';
import { useAuth } from './AuthProvider';
import { useIdleLogout } from './useIdleLogout';
import { useTheme } from './useTheme';

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Bosh admin',
  OPERATOR: 'Operator',
  MODERATOR: 'Moderator',
};

/**
 * Panel qobigʻi: chap menyu + tepa panel + sahifa.
 *
 * Menyu SERVER bergan boʻlimlardan quriladi — panelda alohida ruxsat
 * jadvali yoʻq. Shuning uchun menyuda koʻringan boʻlim ochilganda 403
 * chiqishi mumkin emas.
 */
export function Shell() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const idle = useIdleLogout(admin?.idleTimeoutSeconds ?? 1800, () => signOut('idle'));

  if (!admin) return null;

  const menu = menuFor(admin.sections);

  return (
    <div className="flex min-h-full">
      {/* Oʻng chegara Dark temada SHART: u yerda menyu foni sahifa foniga
          juda yaqin va chegarasiz ikkovi bitta yuza boʻlib koʻrinadi. */}
      <nav className="flex w-sidebar shrink-0 flex-col border-r border-border bg-sidebar px-12 py-20">
        {/* Hoshiya menyu foni uchun: belgi gradientining toʻq burchagi
            menyu foniga 1.04:1 kontrast bilan singib ketadi. `sidebar-text`
            ikkala temada bir xil ochiq, 35% da chiziq ~3:1 — koʻrinadi,
            lekin belgidan diqqatni tortmaydi. */}
        <div className="mb-24 flex items-center gap-8 px-8">
          <BrandMark size={32} decorative className="border border-sidebar-text/35" />
          <div className="min-w-0">
            <p className="text-h3 text-sidebar-text">Hizmat24</p>
            <p className="text-caption text-sidebar-text/60">Boshqaruv paneli</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {menu.map((section) => (
            <li key={section.key}>
              <NavLink
                to={section.path}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between gap-8 rounded-md px-12 py-8 text-body transition-colors',
                    isActive
                      ? 'bg-sidebar-active text-sidebar-text'
                      : 'text-sidebar-text/70 hover:bg-sidebar-text/10 hover:text-sidebar-text',
                  ].join(' ')
                }
              >
                <span>{section.title}</span>
                {section.stage && (
                  <span className="rounded-full bg-sidebar-text/15 px-8 py-2 text-caption text-sidebar-text/70">
                    tez orada
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-16 border-b border-border bg-surface-elevated px-24 py-12">
          <div className="min-w-0">
            <p className="truncate text-body-strong text-text-primary">{admin.fullName}</p>
            <p className="truncate text-caption text-text-secondary">{admin.email}</p>
          </div>

          <div className="flex items-center gap-12">
            <Pill>{ROLE_LABELS[admin.role] ?? admin.role}</Pill>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Yorugʻ temaga oʻtish' : 'Qorongʻi temaga oʻtish'}
              className="flex h-32 w-32 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-surface hover:text-text-primary"
            >
              {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            </button>

            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/login', { replace: true });
              }}
              className="flex h-32 items-center gap-8 rounded-md px-12 text-caption-strong text-text-secondary hover:bg-neutral-surface hover:text-text-primary"
            >
              <LogOut size={16} aria-hidden />
              Chiqish
            </button>
          </div>
        </header>

        {idle.phase === 'warning' && (
          <div className="px-24 pt-16">
            <Notice tone="warning">
              Harakat boʻlmagani uchun {formatCountdown(idle.secondsLeft)} dan keyin tizimdan
              chiqarilasiz. Davom etish uchun sahifani bosing.
            </Notice>
          </div>
        )}

        <main className="min-w-0 flex-1 px-24 py-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
