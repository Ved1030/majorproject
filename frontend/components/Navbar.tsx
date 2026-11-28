"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import ZipDropLogo from "./brand/ZipDropLogo";
import { MegaMenu, ToolsDropdownButton } from "./navbar/MegaMenu";
import MobileNavDrawer from "./navbar/MobileNavDrawer";
import {
  GET_STARTED_NAV_ITEM,
  HELP_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  TOOLS_NAV_ITEM,
  isNavItemActive,
  type NavItem,
} from "./navbar/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [hash, setHash] = useState("");
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const syncHash = useCallback((href: string) => {
    const nextHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
    }
    setHash(nextHash);
  }, []);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
      setIsMobileMenuOpen(false);
      setToolsDropdownOpen(false);
      if (!item.sectionId) return;

      const element = document.getElementById(item.sectionId);
      if (element) {
        event.preventDefault();
        element.scrollIntoView({ behavior: "smooth" });
        syncHash(item.href);
      }
    },
    [syncHash],
  );

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const closeToolsDropdown = useCallback(() => setToolsDropdownOpen(false), []);

  const StartIcon = GET_STARTED_NAV_ITEM.icon;

  return (
    <header className="zd-site-header">
      <nav className="zd-main-nav" aria-label="Main navigation">
        <Link href="/" className="zd-nav-logo" aria-label="ZipDrop home">
          <ZipDropLogo size="small" />
        </Link>

        <div className="zd-nav-center">
          {PRIMARY_NAV_ITEMS.map((item) => {
            if (item.id === TOOLS_NAV_ITEM.id) {
              return (
                <div className="zd-nav-tools" key={item.id}>
                  <ToolsDropdownButton
                    ref={toolsButtonRef}
                    onClick={() => setToolsDropdownOpen((value) => !value)}
                    isOpen={toolsDropdownOpen}
                    active={isNavItemActive(pathname, hash, item)}
                  />
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`zd-nav-link${isNavItemActive(pathname, hash, item) ? " active" : ""}`}
                aria-current={isNavItemActive(pathname, hash, item) ? "page" : undefined}
                onClick={(event) => handleNavClick(event, item)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="zd-nav-actions">
          <a
            href={HELP_NAV_ITEM.href}
            className="zd-nav-link zd-nav-help-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Help
          </a>

          <Link
            href={GET_STARTED_NAV_ITEM.href}
            className="zd-nav-cta"
            onClick={(event) => handleNavClick(event, GET_STARTED_NAV_ITEM)}
          >
            Get Started
            <StartIcon size={16} strokeWidth={2.4} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="zd-mobile-nav-drawer"
          >
            <Menu size={22} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {toolsDropdownOpen && (
        <MegaMenu
          isOpen={toolsDropdownOpen}
          onClose={closeToolsDropdown}
          triggerRef={toolsButtonRef}
        />
      )}

      <MobileNavDrawer open={isMobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}
