import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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

const COMPRESSION_SLUGS = ["jpg", "pdf", "png", "webp"];

const TRUST_PAGES = ["/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const primaryPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/editor`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/conversion`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/compression`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/image-tools/background-remover`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pdf/merge`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pdf/split`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pdf/organize`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const conversionPages: MetadataRoute.Sitemap = CONVERSION_SLUGS.map((slug) => ({
    url: `${SITE_URL}/conversion/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const compressionPages: MetadataRoute.Sitemap = COMPRESSION_SLUGS.map((slug) => ({
    url: `${SITE_URL}/compression/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const trustPages: MetadataRoute.Sitemap = TRUST_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  return [
    ...primaryPages,
    ...blogPages,
    ...conversionPages,
    ...compressionPages,
    ...trustPages,
  ];
}
