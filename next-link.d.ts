// Type declarations for next/link
import { ComponentPropsWithoutRef, ElementType, ForwardRefExoticComponent, ReactNode } from "react";

declare module "next/link" {
  interface LinkProps {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    children: ReactNode;
  }

  const Link: ForwardRefExoticComponent<LinkProps & ComponentPropsWithoutRef<"a">>;
  export default Link;
}