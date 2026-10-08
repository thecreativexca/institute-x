import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PublicMotion } from "@/components/public/public-motion";
import { getSession } from "@/lib/auth/session";

import "./public.css";

/**
 * Public website shell (Header/Footer) for marketing pages.
 * Route group keeps URLs unchanged: "/", "/courses", "/about", "/contact".
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="public-theme flex min-h-screen flex-col">
      <PublicMotion />
      <Header session={session} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
