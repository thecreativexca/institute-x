"use client";

import { useEffect } from "react";

/**
 * Global error boundary — catches errors thrown by the root layout itself.
 * Must render its own <html>/<body> since the root layout has failed.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f6f8fb",
        }}
      >
        <div role="alert" style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", color: "#0f172a" }}>
            Application error
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#475569", lineHeight: 1.6 }}>
            The application could not start properly. Please reload the page.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: "1.25rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#274de3",
              color: "#ffffff",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
