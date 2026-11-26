import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const LAST_MODIFIED = new Date("2026-11-26T00:00:00.000Z");

const BLOG_SLUGS = [
  "airdrop-alternative",
  "airdrop-alternative-android",
  "airdrop-alternative-windows",
  "android-file-transfer-windows",
  "best-file-sharing-website",
  "file-sharing-websites",
  "file-transfer-website",
  "file-transfer-without-usb",
  "free-file-transfer-online",
  "how-to-share-files-between-phone-and-pc",
  "how-to-transfer-files-phone-to-laptop",
  "mobile-to-pc-file-transfer",
  "online-clipboard",
  "online-clipboard-alternatives",
  "online-clipboard-without-login",
  "phone-to-pc-file-transfer",
  "send-files-online-free",
  "send-files-via-link",
  "send-large-files-online",
  "send-photos-from-phone-to-laptop",
  "share-files-between-devices",
  "share-files-online",
  "share-files-without-login",
  "share-large-files-online",
  "share-text-files-between-devices",
  "snapdrop-alternative",
  "transfer-files-android-to-pc",
  "transfer-files-from-android-to-pc-wireless",
  "transfer-files-from-phone-to-pc-wireless",
  "transfer-files-iphone-to-android",
  "transfer-files-iphone-to-windows",
  "transfer-files-online",
  "upload-and-share-files",
  "web-file-transfer",
  "wetransfer-alternative",
  "zipdrop-vs-online-clipboard",
];

const CONVERSION_SLUGS = [
  "csv-to-excel",
  "excel-to-csv",
  "excel-to-pdf",
  "html-to-pdf",
  "images-to-pdf",
  "jpg-to-pdf",
  "jpg-to-png",
  "jpg-to-webp",
  "pdf-to-excel",
  "pdf-to-html",
  "pdf-to-jpg",
  "pdf-to-pdfa",
  "pdf-to-png",
  "pdf-to-ppt",
  "pdf-to-txt",
  "pdf-to-word",
  "png-to-jpg",
  "png-to-pdf",
  "png-to-webp",
  "ppt-to-pdf",
  "rtf-to-word",
  "svg-to-png",
  "txt-to-pdf",
  "webp-to-jpg",
  "word-to-html",
  "word-to-pdf",
  "word-to-txt",
];

const GENERIC_TOOL_PATHS = [
  "/compression/jpg",
  "/compression/pdf",
  "/compression/png",
  "/compression/webp",
  "/pdf/merge",
  "/pdf/organize",
  "/pdf/split",
];

function entry(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly"
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    entry("/", 1, "weekly"),
    entry("/blog", 0.8, "weekly"),
    entry("/conversion", 0.8, "weekly"),
    entry("/compression", 0.8, "weekly"),
    entry("/editor", 0.7, "monthly"),

    entry("/compress-pdf-under-100kb", 0.9, "weekly"),
    entry("/compression/compress-pdf", 0.9, "weekly"),
    entry("/compression/compress-image", 0.9, "weekly"),
    entry("/conversion/pdf-to-word", 0.9, "weekly"),
    entry("/image-tools/background-remover", 0.9, "weekly"),

    ...CONVERSION_SLUGS.map((slug) =>
      entry(`/conversion/${slug}`, slug === "pdf-to-word" ? 0.9 : 0.7)
    ),
    ...GENERIC_TOOL_PATHS.map((path) => entry(path, 0.7)),

    ...BLOG_SLUGS.map((slug) => entry(`/blog/${slug}`, 0.6, "monthly")),

    entry("/about", 0.4, "yearly"),
    entry("/contact", 0.4, "yearly"),
    entry("/privacy-policy", 0.3, "yearly"),
    entry("/terms", 0.3, "yearly"),
  ];
}
