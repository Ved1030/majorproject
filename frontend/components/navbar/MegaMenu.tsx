"use client";

import { useEffect, useRef, useState, forwardRef } from "react";
import { usePathname } from "next/navigation";
import { TOOL_CATEGORIES, getCategoryById, DEFAULT_CATEGORY_ID } from "@/data/toolCategories";
import { CategoryNavigation } from "./CategoryNavigation";
import { ToolColumns } from "./ToolColumns";
import { X, ChevronDown } from "lucide-react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function MegaMenu({ isOpen, onClose, triggerRef }: MegaMenuProps) {
  const pathname = usePathname();
  const [activeCategoryId, setActiveCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const activeCategory = getCategoryById(activeCategoryId) || TOOL_CATEGORIES[0];

  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !megaMenuRef.current) return;

      const focusable = Array.from(
        megaMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target as Node) &&
        trigger &&
        !trigger.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const handleViewportChange = () => {
      if (mobileQuery.matches) onClose();
    };

    if (mobileQuery.matches) {
      onClose();
      return;
    }

    mobileQuery.addEventListener?.("change", handleViewportChange);
    return () => mobileQuery.removeEventListener?.("change", handleViewportChange);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={megaMenuRef}
      id="zd-mega-menu"
      className="mega-menu"
      role="dialog"
      aria-label="Tools menu"
      style={{
        left: 0,
        right: 0,
        zIndex: 200,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="mega-menu-header">
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          All Tools
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close mega menu"
          className="mega-menu-close"
        >
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <CategoryNavigation activeCategoryId={activeCategoryId} onCategoryChange={setActiveCategoryId} />

      <div className="mega-menu-content">
        <ToolColumns category={activeCategory} />
      </div>
    </div>
  );
}

interface ToolsDropdownButtonProps {
  onClick: () => void;
  isOpen: boolean;
  active: boolean;
}

export const ToolsDropdownButton = forwardRef<HTMLButtonElement, ToolsDropdownButtonProps>(
  ({ onClick, isOpen, active }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`zd-nav-link zd-nav-tools-button${isOpen || active ? " active" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="zd-mega-menu"
      >
        Tools
        <ChevronDown size={15} strokeWidth={2.4} className="zd-nav-chevron" aria-hidden="true" />
      </button>
    );
  },
);

ToolsDropdownButton.displayName = "ToolsDropdownButton";
