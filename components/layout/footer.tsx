import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

/** Public website footer. All identity values come from siteConfig/catalog. */
export function Footer() {
  const year = new Date().getFullYear();
  const hasAddress = Boolean(siteConfig.contact.address.trim());

  return (
    <footer className="public-footer">
      <Container>
        <div className="public-footer-top">
          <div className="public-footer-mark">
            <Logo />
            <p>
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Footer — institute links">
            <h3>
              Institute
            </h3>
            <ul>
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer — learning links">
            <h3>
              Learn
            </h3>
            <ul>
              <li><Link href="/courses">Browse courses</Link></li>
              <li><Link href="/register">Create student account</Link></li>
              <li><Link href="/login">Student login</Link></li>
              <li><Link href="/verify-certificate">Verify certificate</Link></li>
            </ul>
          </nav>

          <div>
            <h3>
              Contact
            </h3>
            <ul>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.phoneHref}
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              {hasAddress ? <li>{siteConfig.contact.address}</li> : null}
            </ul>
          </div>
        </div>

        <div className="public-footer-bottom">
          <p className="public-footer-credits">
            © {year} {siteConfig.name}. Photography by Haseeb Modi, Gaurav Tiwari and Vitaly Gariev via Unsplash.
          </p>
          <nav aria-label="Footer — legal" className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
            >
              Terms & Conditions
            </Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
