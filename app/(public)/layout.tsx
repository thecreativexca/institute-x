import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/auth/session";

/**
 * Public website shell (Header/Footer) for marketing pages.
 * Route group keeps URLs unchanged: "/", "/courses", "/about", "/contact".
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="public-theme flex min-h-screen flex-col">
      <Header session={session} />
      <main id="main-content" className="flex-1 bg-surface">
        {children}
      </main>
      <Footer />
    </div>
  );
}
