import { cn } from "@/lib/utils/cn";

interface IconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

export function ShareIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51a.71.71 0 0 1 1.01 0L18 19M4.44 6.44a.71.71 0 0 1 1.01 0L6 12" />
    </svg>
  );
}

export function CopyIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function WhatsAppIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.454.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.67m-5.421 7.402h-.004a9.87 9.87 0 0 1-5.031-1.378 9.86 9.86 0 0 1-.39-.43c-.179-.179-.334-.362-.522-.522a9.86 9.86 0 0 1-.43-.39 9.87 9.87 0 0 1-1.379-5.031h-.003a9.87 9.87 0 0 1 9.865-9.865 9.87 9.87 0 0 1 9.865 9.865 9.87 9.87 0 0 1-9.865 9.865m8.408-13.721A9.87 9.87 0 0 0 11.994 0C5.373 0 0 5.373 0 11.994a9.87 9.87 0 0 0 9.865 9.865 9.87 9.87 0 0 0 9.865-9.865 9.87 9.87 0 0 0-9.865-9.865" />
    </svg>
  );
}

export function FacebookIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function LinkedInIcon({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}