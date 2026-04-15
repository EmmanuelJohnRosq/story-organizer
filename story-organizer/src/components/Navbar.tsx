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
    <div className="fixed top-12 bottom-0 left-0 z-50 flex flex-col pointer-events-none xxs:pl-0">
      <aside
        className={`
          pointer-events-auto overflow-auto backdrop-blur border shadow-2xl
          border-blue-300/80 dark:border-gray-900/60 bg-blue-400/50 dark:bg-gray-900 

          /* Mobile: Fixed Bottom (Override Wrapper) */
          fixed flex bottom-0 left-0 right-0 h-11 w-full flex-row justify-around p-1
          
          /* Desktop: Left Vertical Sidebar */
          xxs:block xxs:relative xxs:bottom-auto xxs:left-0 xxs:h-full xxs:max-h-[calc(100vh-4rem)] 
          xxs:w-13 xxs:flex-col xxs:my-auto xxs:rounded-r-2xl xxs:p-1 scroll-left
          
          ${className}
        `}
        aria-label="Page actions"
      >
        <div className="flex flex-row space-x-4 xxs:space-y-2 xxs:flex-col xxs:space-x-0">
          {actions.map(action => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.title}
              className={`group flex w-full flex-col items-center gap-1 rounded-xl px-1 xxs:py-2 text-[11px] font-semibold transition ${
                action.isActive
                  ? "bg-blue-600/30 text-blue-100"
                  : "text-gray-800 dark:text-slate-100 hover:bg-blue-500/20"
              } ${action.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300/30 bg-gray-800 text-lg transition group-hover:border-gray-200/60">
                <FontAwesomeIcon icon={action.icon} className="text-white"/>
              </span>
              <span className="hidden xxs:block leading-tight text-center">{action.label}</span>
              {action.badge && <span className="hidden xxs:block text-[9px] uppercase tracking-wide text-gray-800/70 dark:text-gray-200/70">{action.badge}</span>}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}