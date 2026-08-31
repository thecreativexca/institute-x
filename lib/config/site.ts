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
  /**
   * TEMPORARY development name. Replace with the real institute name.
   */
  name: "Skill Development Institute",
  shortName: "SDI",
  tagline: "Learn practical skills. Build a professional career.",
  description:
    "A professional skill development institute offering structured, career-focused training in computer skills, web development, design, digital marketing, healthcare and personal development.",
  /** Path to logo asset inside /public. Replace with client's logo. */
  logo: "/assets/logo.svg",
  /** Metadata base URL. Falls back to localhost in development. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  contact: {
    /**
     * TEMPORARY development contact details. Replace with real ones.
     */
    email: "info@example.edu.in",
    phone: "+91-00000-00000",
    phoneHref: "tel:+910000000000",
    address: "Institute address line, City, State — PIN",
  },

  social: {
    links: [] as SocialLink[],
  },

  /**
   * Certificate issuance & design configuration (Phase 12).
   *
   * Centralized so certificate wording, numbering, branding and signatory
   * details live in ONE place. All values below are neutral placeholders —
   * replace them with the real institute's details. `logoImageUrl` /
   * `signatureImageUrl` / `sealImageUrl` accept an absolute URL to a raster
   * (PNG/JPEG) asset; when absent the certificate renders a clean text
   * wordmark and omits any fake signature/seal (never invent accreditation).
   */
  certificate: {
    /** Prefix used in the human-readable certificate number. */
    prefix: "INST",
    /** Short type code embedded in the certificate number (e.g. CN). */
    typeCode: "CN",
    /** Institute heading printed at the top of the certificate. */
    heading: "Certificate of Completion",
    /**
     * Wording template. `{studentName}` and `{courseName}` are replaced with
     * snapshot data at issuance time — nothing is hardcoded per issuance.
     */
    statement:
      "This is to certify that {studentName} has successfully completed the {courseName} training program.",
    /** Footer verification note printed near the QR code. */
    footerNote:
      "Verify this certificate online with the included verification code.",
    /** Optional raster logo URL. Falls back to the institute name wordmark. */
    logoImageUrl: null as string | null,
    /** Optional raster signature image URL. Omitted when not configured. */
    signatureImageUrl: null as string | null,
    /** Optional raster seal image URL. Omitted when not configured. */
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
