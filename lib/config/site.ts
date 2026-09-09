/**
 * Central branding & site configuration.
 *
 * ALL institute identity values live here. Replace the temporary development
 * values with the real client's information — no other file should duplicate
 * these values.
 */

export interface SocialLink {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "Creative X Tycoon",
  shortName: "Creative X Tycoon",
  tagline: "Creative learning. Professional growth.",
  description:
    "Creative X Tycoon offers structured, career-focused training in technology, design, digital marketing, healthcare and professional development.",
  logo: "/assets/creative-x-tycoon-logo.png",
  /** Path to logo asset inside /public. Replace with client's logo. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  contact: {
    email: "info@creativextycoon.com",
    phone: "+91-00000-00000",
    phoneHref: "tel:+910000000000",
    address: "Creative X Tycoon, City, State — PIN",
  },

  social: {
    links: [] as SocialLink[],
  },

  certificate: {
    prefix: "CXT",
    typeCode: "CN",
    heading: "Certificate of Completion",
    statement:
      "This is to certify that {studentName} has successfully completed the {courseName} training program at Creative X Tycoon.",
    footerNote:
      "Verify this certificate online with the included verification code.",
    logoImageUrl: null as string | null,
    signatureImageUrl: null as string | null,
    sealImageUrl: null as string | null,
    signatory: {
      name: "Authorised Signatory",
      designation: "Director",
    } as const,
  },

  navigation: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
