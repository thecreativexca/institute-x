"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import {
  ShareIcon,
  CopyIcon,
  CheckIcon,
  WhatsAppIcon,
  FacebookIcon,
  LinkedInIcon,
} from "@/components/ui/icons";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export function SocialShare({ url, title, description, className }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const shareSupported = typeof navigator !== "undefined" && navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch {
        // User cancelled or error
      }
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className={buttonVariants("ghost", "sm", "gap-1.5")}
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600">Copied</span>
          </>
        ) : (
          <>
            <CopyIcon className="h-4 w-4" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {shareSupported && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={buttonVariants("ghost", "sm", "gap-1.5")}
          aria-label="Share via system share sheet"
        >
          <ShareIcon className="h-4 w-4" />
          <span>Share</span>
        </button>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants("ghost", "sm", "gap-1.5")}
        aria-label="Share on WhatsApp"
      >
        <WhatsAppIcon className="h-4 w-4 text-green-600" />
        <span className="sr-only">WhatsApp</span>
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants("ghost", "sm", "gap-1.5")}
        aria-label="Share on Facebook"
      >
        <FacebookIcon className="h-4 w-4 text-blue-600" />
        <span className="sr-only">Facebook</span>
      </a>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants("ghost", "sm", "gap-1.5")}
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon className="h-4 w-4 text-blue-700" />
        <span className="sr-only">LinkedIn</span>
      </a>
    </div>
  );
}