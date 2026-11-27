"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Home,
  Layers,
  PenTool,
  Share2,
  X,
} from "lucide-react";
import ZipDropLogo from "@/components/brand/ZipDropLogo";
import { TOOL_REGISTRY, type RegisteredTool, type ToolCategoryId } from "@/config/toolRegistry";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ToolCategoryId, string> = {
  pdf: "PDF Tools",
  office: "Conversion Tools",
  image: "Image Tools",
  document: "Document Tools",
  compression: "Compression Tools",
  editing: "Document Editors",
  sharing: "Other Tools",
};

const CATEGORY_ORDER: ToolCategoryId[] = [
  "pdf",
  "office",
  "document",
  "compression",
  "image",
  "editing",
  "sharing",
];

const MAIN_LINKS = [
  { href: "/", label: "Home", icon: Home, sectionId: "home" },
  { href: "/#share-receive", label: "Share", icon: Share2, sectionId: "share-receive" },
  { href: "/editor", label: "Editor", icon: PenTool, sectionId: null },
  { href: "/about", label: "About", icon: null, sectionId: null },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  const path = href.split("#")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [toolsOpen, setToolsOpen] = useState(() =>
    TOOL_REGISTRY.some((tool) => isActive(pathname, tool.href))
  );
  const [expanded, setExpanded] = useState<string[]>([]);
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  }, [closing, onClose]);
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  const groupedTools = useMemo(() => {
    return CATEGORY_ORDER.map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      tools: TOOL_REGISTRY.filter((tool) => tool.category === id),
    })).filter((group) => group.tools.length > 0);
  }, []);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string | null) => {
      requestClose();
      if (!sectionId || pathname !== "/") return;
      const element = document.getElementById(sectionId);
      if (element) {
        event.preventDefault();
        window.setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 50);
      }
    },
    [requestClose, pathname],
  );

  if (!open) return null;

  return (
    <div className={`zd-mobile-nav-root${closing ? " closing" : ""}`}>
      <div className="zd-mobile-nav-overlay" onClick={requestClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        id="zd-mobile-nav-drawer"
        className="zd-mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation menu"
      >
        <div className="zd-mobile-nav-header">
          <Link href="/" className="zd-mobile-nav-logo" onClick={(e) => handleNavClick(e, "home")} aria-label="ZipDrop home">
            <ZipDropLogo size="small" />
          </Link>
          <button ref={closeRef} type="button" className="zd-mobile-nav-close" onClick={requestClose} aria-label="Close menu">
            <X size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        <div className="zd-mobile-nav-scroll">
          <nav aria-label="Mobile main navigation" className="zd-mobile-nav-links">
            {MAIN_LINKS.slice(0, 1).map((link) => (
              <NavLink key={link.href} link={link} active={isActive(pathname, link.href)} onClick={handleNavClick} />
            ))}

            <div className="zd-mobile-nav-tools">
              <button
                type="button"
                className={`zd-mobile-nav-link${isToolPage(pathname) ? " active" : ""}`}
                onClick={() => setToolsOpen((value) => !value)}
                aria-expanded={toolsOpen}
                aria-controls="mobile-tools-groups"
              >
                <Layers size={19} aria-hidden="true" />
                <span>Tools</span>
                <ChevronDown size={18} className={`zd-mobile-nav-chevron${toolsOpen ? " open" : ""}`} aria-hidden="true" />
              </button>

              <div
                id="mobile-tools-groups"
                className={`zd-mobile-nav-collapsible${toolsOpen ? " open" : ""}`}
                aria-hidden={!toolsOpen}
              >
                <Link href="/conversion" className="zd-mobile-nav-all-tools" onClick={requestClose}>
                  View all tools
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
                {groupedTools.map((group) => {
                  const key = `${group.id}-${group.label}`;
                  const isOpen = expanded.includes(key);
                  return (
                    <div key={key} className="zd-mobile-nav-group">
                      <button
                        type="button"
                        className="zd-mobile-nav-group-toggle"
                        onClick={() =>
                          setExpanded((current) =>
                            current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
                          )
                        }
                        aria-expanded={isOpen}
                        tabIndex={toolsOpen ? 0 : -1}
                      >
                        <span>{group.label}</span>
                        <span className="zd-mobile-nav-group-count">{group.tools.length}</span>
                        <ChevronDown size={16} className={`zd-mobile-nav-chevron${isOpen ? " open" : ""}`} aria-hidden="true" />
                      </button>
                      <div className={`zd-mobile-nav-collapsible${isOpen ? " open" : ""}`} aria-hidden={!isOpen}>
                        <div className="zd-mobile-nav-tool-list">
                          {group.tools.map((tool) => (
                            <ToolLink key={tool.id} tool={tool} active={isActive(pathname, tool.href)} onClose={requestClose} tabIndex={toolsOpen && isOpen ? 0 : -1} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {MAIN_LINKS.slice(1).map((link) => (
              <NavLink key={link.href} link={link} active={isActive(pathname, link.href)} onClick={handleNavClick} />
            ))}

            <Link
              href="/contact"
              className={`zd-mobile-nav-link${isActive(pathname, "/contact") ? " active" : ""}`}
              onClick={requestClose}
            >
              <HelpCircle size={19} aria-hidden="true" />
              <span>Help and Support</span>
            </Link>
          </nav>
        </div>

        <div className="zd-mobile-nav-footer">
          <Link href="/#share-receive" className="zd-mobile-nav-cta" onClick={(e) => handleNavClick(e, "share-receive")}>
            Get Started
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

type MainLink = (typeof MAIN_LINKS)[number];

function NavLink({
  link,
  active,
  onClick,
}: {
  link: MainLink;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string | null) => void;
}) {
  const Icon = link.icon;
  return (
    <Link href={link.href} className={`zd-mobile-nav-link${active ? " active" : ""}`} onClick={(e) => onClick(e, link.sectionId)}>
      {Icon ? <Icon size={19} aria-hidden="true" /> : <span className="zd-mobile-nav-link-dot" aria-hidden="true" />}
      <span>{link.label}</span>
    </Link>
  );
}

function ToolLink({ tool, active, onClose, tabIndex }: { tool: RegisteredTool; active: boolean; onClose: () => void; tabIndex: number }) {
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href}
      className={`zd-mobile-nav-tool${active ? " active" : ""}`}
      onClick={onClose}
      tabIndex={tabIndex}
    >
      <Icon size={16} aria-hidden="true" style={{ color: tool.iconColor }} />
      <span>{tool.name}</span>
    </Link>
  );
}

function isToolPage(pathname: string | null) {
  if (!pathname || pathname === "/") return false;
  return ["/conversion", "/compression", "/pdf", "/image-tools", "/editor", "/compress-pdf-under-100kb"].some((path) =>
    pathname.startsWith(path),
  );
}
