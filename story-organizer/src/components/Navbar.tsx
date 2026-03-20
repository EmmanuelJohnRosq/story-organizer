import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type NavbarAction = {
  id: string;
  label: string;
  icon: IconDefinition;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  badge?: string;
  title: string;
};

type NavbarProps = {
  actions: NavbarAction[];
  className?: string;
};

export type { NavbarAction };

export default function Navbar({ actions, className = "" }: NavbarProps) {
  return (
    <aside
      className={`hidden xxs:block fixed -left-1 top-14 z-50 h-[calc(100vh-4rem)] w-17 flex-col overflow-auto scroll-left justify-between rounded-r-2xl border border-blue-300/80 dark:border-gray-900/60 bg-blue-400/50 dark:bg-gray-900 p-1 shadow-2xl backdrop-blur ${className}`}
      aria-label="Page actions"
    >
      <div className="space-y-1">
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title}
            className={`group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition ${
              action.isActive
                ? "bg-blue-600/30 text-blue-100"
                : "text-gray-800 dark:text-slate-100 hover:bg-blue-500/20"
            } ${action.disabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300/30 bg-gray-800 text-lg transition group-hover:border-gray-200/60">
              <FontAwesomeIcon icon={action.icon} className="text-white"/>
            </span>
            <span className="leading-tight text-center">{action.label}</span>
            {action.badge && <span className="text-[9px] uppercase tracking-wide text-gray-800/70 dark:text-gray-200/70">{action.badge}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}