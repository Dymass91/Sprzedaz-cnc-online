"use client";

import { useEffect, useRef, useState } from "react";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { SiteSearch } from "./SiteSearch";
import { AccountPopover } from "./AccountPopover";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[var(--header-height)] border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || menuOpen
          ? "border-line bg-canvas/85 shadow-[0_1px_12px_-6px_rgb(17_26_39/0.12)] backdrop-blur-md"
          : "border-transparent bg-canvas/40 backdrop-blur-[2px]",
      )}
    >
      <a
        href="#tresc"
        className="sr-only rounded-sm bg-ink-900 px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Przejdź do treści
      </a>
      <Container className="flex h-full items-center gap-6">
        <a href="#" aria-label="VEXOR — strona główna" className="shrink-0 rounded-xs">
          <Logo />
        </a>

        <nav aria-label="Główna nawigacja" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-7">
            {mainNav.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href ?? undefined}
                  className="relative py-2 text-[13px] font-medium text-ink-700 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink-900 after:transition-transform after:duration-300 hover:text-ink-900 hover:after:scale-x-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center rounded-sm text-ink-800 transition-colors hover:bg-surface-sunken"
            aria-label="Szukaj na stronie"
          >
            <SearchIcon />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-sm text-ink-800 transition-colors hover:bg-surface-sunken"
              aria-label="Konto klienta"
              aria-expanded={accountOpen}
              aria-controls="account-popover"
            >
              <UserIcon />
            </button>
            <AccountPopover id="account-popover" open={accountOpen} onClose={() => setAccountOpen(false)} />
          </div>
          <div className="ml-2 hidden sm:block">
            <ButtonLink href="#konfigurator" size="sm" withArrow className="h-10 px-5">
              Zamów część
            </ButtonLink>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-sm text-ink-900 transition-colors hover:bg-surface-sunken lg:hidden"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </Container>

      {/* Menu mobilne */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="fixed inset-x-0 top-[var(--header-height)] bottom-0 overflow-y-auto border-t border-line bg-canvas lg:hidden"
      >
        <Container as="nav" aria-label="Menu mobilne" className="py-6">
          <ul className="divide-y divide-line">
            {mainNav.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href ?? undefined}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-4 font-display text-xl font-semibold text-ink-900 uppercase"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-ink-300">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href="#konfigurator" withArrow className="mt-6 w-full" onClick={() => setMenuOpen(false)}>
            Zamów część
          </ButtonLink>
        </Container>
      </div>

      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
