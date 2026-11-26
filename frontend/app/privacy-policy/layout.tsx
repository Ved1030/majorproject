import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Privacy Policy – ZipDrop File Sharing & Tools";
const DESCRIPTION =
  "How ZipDrop handles uploaded files, 4-digit share codes, temporary conversion jobs, analytics and 48-hour expiry records. Plain-language privacy policy for a free file utility site.";
const URL = `${SITE_URL}/privacy-policy`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
