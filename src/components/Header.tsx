import { ReactNode } from "react";
import { Logo } from "./Logo";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="header-gradient safe-top pt-10">
      <div className="relative z-10 px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo />
          {children}
        </div>
        {(title || subtitle) && (
          <div className="mt-6">
            {title && (
              <h1 className="text-2xl font-bold text-primary-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-primary-foreground/80 mt-1 text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          className="w-full h-8"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,60 L0,60 Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </header>
  );
}
