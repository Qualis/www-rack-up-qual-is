import { ThemeSwitcher } from "./theme-switcher";
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-accent-1/95 dark:bg-accent-3/95 backdrop-blur-sm border-b border-primary/10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-all duration-200 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary dark:text-primary-dark"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 9v6m0-3h2m0-5v10m12-10v10m0-5h2m0-3v6M8 12h8"
              />
            </svg>
            <span className="text-xl font-bold text-black dark:text-white relative">
              RackUp
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary dark:bg-primary transition-all duration-200 group-hover:w-full"></span>
            </span>
          </Link>

          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
