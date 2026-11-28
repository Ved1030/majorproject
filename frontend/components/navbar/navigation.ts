import {
  ArrowRight,
  HelpCircle,
  Home,
  Info,
  Layers,
  PenTool,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  sectionId: string | null;
}

const HOME_ITEM: NavItem = { id: "home", href: "/", label: "Home", icon: Home, sectionId: "home" };
const TOOLS_ITEM: NavItem = { id: "tools", href: "/conversion", label: "Tools", icon: Layers, sectionId: null };
const SHARE_ITEM: NavItem = { id: "share", href: "/#share-receive", label: "Share", icon: Share2, sectionId: "share-receive" };
const EDITOR_ITEM: NavItem = { id: "editor", href: "/editor", label: "Editor", icon: PenTool, sectionId: null };
const ABOUT_ITEM: NavItem = { id: "about", href: "/about", label: "About", icon: Info, sectionId: null };

export const TOOLS_NAV_ITEM = TOOLS_ITEM;
export const MAIN_NAV_ITEMS: NavItem[] = [HOME_ITEM, SHARE_ITEM, EDITOR_ITEM, ABOUT_ITEM];
export const PRIMARY_NAV_ITEMS: NavItem[] = [HOME_ITEM, TOOLS_ITEM, SHARE_ITEM, EDITOR_ITEM, ABOUT_ITEM];

export const HELP_NAV_ITEM: NavItem = {
  id: "help",
  href: `mailto:${CONTACT_EMAIL}?subject=ZipDrop%20Help`,
  label: "Help",
  icon: HelpCircle,
  sectionId: null,
};

export const GET_STARTED_NAV_ITEM: NavItem = {
  id: "get-started",
  href: "/#share-receive",
  label: "Get Started",
  icon: ArrowRight,
  sectionId: "share-receive",
};

const TOOL_PATH_PREFIXES = [
  "/conversion",
  "/compression",
  "/pdf",
  "/image-tools",
  "/compress-pdf-under-100kb",
];

export function isNavItemActive(pathname: string | null, hash: string, item: NavItem): boolean {
  if (!pathname) return false;

  if (item.id === "home") return pathname === "/" && hash !== "#share-receive";
  if (item.id === "share") return pathname === "/" && hash === "#share-receive";
  if (item.id === "tools") {
    return TOOL_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }

  const path = item.href.split("#")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}
