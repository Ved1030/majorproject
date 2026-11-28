"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  type LucideIcon,
} from "lucide-react";
import ZipDropLogo from "@/components/brand/ZipDropLogo";
import { TOOL_CATEGORIES, type Tool } from "@/data/toolCategories";
import { TOOL_REGISTRY, type RegisteredTool, type ToolCategoryId } from "@/config/toolRegistry";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface MobileTool {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  available: boolean;
  comingSoon?: boolean;
}

interface MobileToolGroup {
  id: string;
  title: string;
  tools: MobileTool[];
}

interface MobileToolCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  groups: MobileToolGroup[];
}

const REGISTRY_CATEGORY_LABELS: Record<ToolCategoryId, string> = {
  pdf: "PDF Tools",
  office: "Conversion Tools",
  image: "Image Tools",
  document: "Document Tools",
  compression: "Compression Tools",
  editing: "Document Editors",
  sharing: "Other Tools",
};

const REGISTRY_CATEGORY_IDS: Record<ToolCategoryId, string> = {
  pdf: "pdf-tools",
  office: "conversion-tools",
  image: "image-tools",
  document: "document-tools",
  compression: "compression-tools",
  editing: "online-editor",
  sharing: "registry-sharing",
};

const IMAGE_INPUT_FORMATS = new Set(["jpg", "png", "webp", "svg", "image"]);

const MAIN_LINKS = [
  { href: "/", label: "Home", icon: Home, sectionId: "home" },
  { href: "/#share-receive", label: "Share", icon: Share2, sectionId: "share-receive" },
  { href: "/editor", label: "Editor", icon: PenTool, sectionId: null },
  { href: "/about", label: "About", icon: null, sectionId: null },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname || href.includes("#")) return false;
  const path = href.split("#")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function toDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function toMobileTool(tool: Tool, fallbackIcon: LucideIcon, fallbackColor: string): MobileTool {
  return {
    id: tool.id,
    name: tool.name,
    href: tool.href,
    icon: (tool.icon ?? fallbackIcon) as LucideIcon,
    iconColor: tool.iconColor ?? fallbackColor,
    available: tool.available,
    comingSoon: tool.comingSoon,
  };
}

function registryGroupTitle(tool: RegisteredTool, categoryId: string) {
  if (categoryId === "compression-tools") {
    return tool.inputFormats.some((format) => IMAGE_INPUT_FORMATS.has(format))
      ? "Image Compression"
      : "PDF Compression";
  }
  return "All Tools";
}

function buildMobileCategories(): MobileToolCategory[] {
  const categories: MobileToolCategory[] = TOOL_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon as LucideIcon,
    iconColor: category.iconColor,
    iconBg: category.iconBg,
    groups: category.groups.map((group) => ({
      id: `${category.id}:${group.title}`,
      title: group.title,
      tools: group.tools.map((tool) =>
        toMobileTool(tool, category.icon as LucideIcon, category.iconColor),
      ),
    })),
  }));

  const seenIds = new Set(
    categories.flatMap((category) => category.groups.flatMap((group) => group.tools.map((tool) => tool.id))),
  );
  const seenHrefs = new Set(
    categories.flatMap((category) => category.groups.flatMap((group) => group.tools.map((tool) => tool.href))),
  );

  for (const tool of TOOL_REGISTRY) {
    if (seenIds.has(tool.id) || seenHrefs.has(tool.href)) continue;

    const categoryId = REGISTRY_CATEGORY_IDS[tool.category];
    let category = categories.find((item) => item.id === categoryId);
    if (!category) {
      category = {
        id: categoryId,
        name: REGISTRY_CATEGORY_LABELS[tool.category],
        icon: tool.icon,
        iconColor: tool.iconColor,
        iconBg: "var(--teal-light)",
        groups: [],
      };
      categories.push(category);
    }

    const title = registryGroupTitle(tool, category.id);
    let group = category.groups.find((item) => item.title === title);
    if (!group) {
      group = { id: `${category.id}:${title}`, title, tools: [] };
      category.groups.push(group);
    }

    group.tools.push({
      id: tool.id,
      name: tool.name,
      href: tool.href,
      icon: tool.icon,
      iconColor: tool.iconColor,
      available: true,
    });
    seenIds.add(tool.id);
    seenHrefs.add(tool.href);
  }

  return categories.filter((category) => category.groups.length > 0);
}

export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const [toolsOpen, setToolsOpen] = useState(() =>
    TOOL_REGISTRY.some((tool) => isActive(pathname, tool.href)),
  );
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const categories = useMemo(() => buildMobileCategories(), []);
  const toolsActive = useMemo(
    () =>
      TOOL_REGISTRY.some((tool) => isActive(pathname, tool.href)) ||
      ["/conversion", "/compression", "/pdf", "/image-tools", "/editor", "/compress-pdf-under-100kb"].some(
        (prefix) => pathname === prefix,
      ),
    [pathname],
  );

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
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

    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener?.("change", handleViewportChange);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener?.("change", handleViewportChange);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, onClose]);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string | null) => {
      onClose();
      if (!sectionId || pathname !== "/") return;
      const element = document.getElementById(sectionId);
      if (element) {
        event.preventDefault();
        window.setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 60);
      }
    },
    [onClose, pathname],
  );

  const toggleCategory = useCallback((id: string) => {
    setOpenCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="zd-mobile-nav-root">
      <div className="zd-mobile-nav-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        id="zd-mobile-nav-drawer"
        className="zd-mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation menu"
      >
        <div className="zd-mobile-nav-header">
          <Link
            href="/"
            className="zd-mobile-nav-logo"
            onClick={(event) => handleNavClick(event, "home")}
            aria-label="ZipDrop home"
          >
            <ZipDropLogo size="small" />
          </Link>
          <button
            ref={closeRef}
            type="button"
            className="zd-mobile-nav-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        <div className="zd-mobile-nav-scroll">
          <nav aria-label="Mobile main navigation" className="zd-mobile-nav-links">
            <NavLink
              link={MAIN_LINKS[0]}
              active={isActive(pathname, MAIN_LINKS[0].href)}
              onClick={handleNavClick}
            />

            <div className="zd-mobile-nav-tools">
              <button
                type="button"
                className={`zd-mobile-nav-link${toolsActive ? " active" : ""}`}
                onClick={() => setToolsOpen((value) => !value)}
                aria-expanded={toolsOpen}
                aria-controls="zd-mobile-tools-panel"
              >
                <Layers size={19} aria-hidden="true" />
                <span>Tools</span>
                <ChevronDown
                  size={18}
                  className={`zd-mobile-nav-chevron${toolsOpen ? " open" : ""}`}
                  aria-hidden="true"
                />
              </button>

              <div
                id="zd-mobile-tools-panel"
                className={`zd-mobile-nav-collapsible${toolsOpen ? " open" : ""}`}
                aria-hidden={!toolsOpen}
              >
                <div className="zd-mobile-nav-collapsible-inner">
                  <Link
                    href="/conversion"
                    className="zd-mobile-nav-all-tools"
                    onClick={onClose}
                    tabIndex={toolsOpen ? 0 : -1}
                  >
                    View all tools
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>

                  {categories.map((category) => {
                    const categoryId = toDomId(category.id);
                    const categoryOpen = openCategories.includes(category.id);
                    const CategoryIcon = category.icon;

                    return (
                      <div key={category.id} className="zd-mobile-nav-group">
                        <button
                          type="button"
                          className="zd-mobile-nav-group-toggle zd-mobile-nav-category-toggle"
                          onClick={() => toggleCategory(category.id)}
                          aria-expanded={categoryOpen}
                          aria-controls={`zd-mobile-category-${categoryId}`}
                          tabIndex={toolsOpen ? 0 : -1}
                        >
                          <CategoryIcon
                            size={18}
                            strokeWidth={2.1}
                            aria-hidden="true"
                            style={{ color: category.iconColor }}
                          />
                          <span>{category.name}</span>
                          <ChevronDown
                            size={16}
                            className={`zd-mobile-nav-chevron${categoryOpen ? " open" : ""}`}
                            aria-hidden="true"
                          />
                        </button>

                        <div
                          id={`zd-mobile-category-${categoryId}`}
                          className={`zd-mobile-nav-collapsible${categoryOpen ? " open" : ""}`}
                          aria-hidden={!categoryOpen}
                        >
                          <div className="zd-mobile-nav-collapsible-inner">
                            {category.groups.map((group) => {
                              const groupDomId = toDomId(group.id);
                              const groupOpen = openGroups.includes(group.id);

                              return (
                                <div key={group.id} className="zd-mobile-nav-subgroup">
                                  <button
                                    type="button"
                                    className="zd-mobile-nav-group-toggle zd-mobile-nav-subgroup-toggle"
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={groupOpen}
                                    aria-controls={`zd-mobile-group-${groupDomId}`}
                                    tabIndex={toolsOpen && categoryOpen ? 0 : -1}
                                  >
                                    <span>{group.title}</span>
                                    <ChevronDown
                                      size={15}
                                      className={`zd-mobile-nav-chevron${groupOpen ? " open" : ""}`}
                                      aria-hidden="true"
                                    />
                                  </button>

                                  <div
                                    id={`zd-mobile-group-${groupDomId}`}
                                    className={`zd-mobile-nav-collapsible${groupOpen ? " open" : ""}`}
                                    aria-hidden={!groupOpen}
                                  >
                                    <div className="zd-mobile-nav-collapsible-inner">
                                      <div className="zd-mobile-nav-tool-list">
                                        {group.tools.map((tool) => (
                                          <ToolLink
                                            key={`${group.id}-${tool.id}-${tool.href}`}
                                            tool={tool}
                                            active={isActive(pathname, tool.href)}
                                            onClose={onClose}
                                            tabIndex={toolsOpen && categoryOpen && groupOpen ? 0 : -1}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {MAIN_LINKS.slice(1).map((link) => (
              <NavLink
                key={link.href}
                link={link}
                active={isActive(pathname, link.href)}
                onClick={handleNavClick}
              />
            ))}

            <Link
              href="/contact"
              className={`zd-mobile-nav-link${isActive(pathname, "/contact") ? " active" : ""}`}
              onClick={onClose}
            >
              <HelpCircle size={19} aria-hidden="true" />
              <span>Help and Support</span>
            </Link>
          </nav>
        </div>

        <div className="zd-mobile-nav-footer">
          <Link
            href="/#share-receive"
            className="zd-mobile-nav-cta"
            onClick={(event) => handleNavClick(event, "share-receive")}
          >
            Get Started
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
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
    <Link
      href={link.href}
      className={`zd-mobile-nav-link${active ? " active" : ""}`}
      onClick={(event) => onClick(event, link.sectionId)}
    >
      {Icon ? <Icon size={19} aria-hidden="true" /> : <span className="zd-mobile-nav-link-dot" aria-hidden="true" />}
      <span>{link.label}</span>
    </Link>
  );
}

function ToolLink({
  tool,
  active,
  onClose,
  tabIndex,
}: {
  tool: MobileTool;
  active: boolean;
  onClose: () => void;
  tabIndex: number;
}) {
  const Icon = tool.icon;
  const content = (
    <>
      <Icon size={16} strokeWidth={2} aria-hidden="true" style={{ color: tool.iconColor }} />
      <span>{tool.name}</span>
      {!tool.available && <span className="zd-mobile-nav-tool-status">Soon</span>}
    </>
  );

  if (!tool.available) {
    return (
      <div
        className={`zd-mobile-nav-tool disabled${active ? " active" : ""}`}
        data-href={tool.href}
        aria-disabled="true"
        tabIndex={-1}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={tool.href}
      className={`zd-mobile-nav-tool${active ? " active" : ""}`}
      onClick={onClose}
      tabIndex={tabIndex}
    >
      {content}
    </Link>
  );
}
