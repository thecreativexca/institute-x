"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  /** Plural noun used in the "Showing x–y of N …" summary. */
  itemLabel?: string;
  /** Required so navigating preserves the active filters. */
  basePath: string;
}

/**
 * Pagination for the certificates list. Same behaviour as the students module
 * (URL-driven, filters preserved) with a configurable base path so the active
 * and revoked views can share it.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = "certificates",
  basePath,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-sm text-slate-600">
        Showing {startItem}–{endItem} of {totalItems} {itemLabel}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => router.push(createPageUrl(currentPage - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "primary" : "outline"}
              size="sm"
              onClick={() => router.push(createPageUrl(pageNum))}
              aria-label={`Page ${pageNum}`}
              aria-current={currentPage === pageNum ? "page" : undefined}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => router.push(createPageUrl(currentPage + 1))}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>

      <div className="flex items-center gap-2">
        <label htmlFor="per-page" className="text-sm text-slate-600">
          Show
        </label>
        <select
          id="per-page"
          value={itemsPerPage}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("limit", e.target.value);
            params.set("page", "1");
            router.push(`${basePath}?${params.toString()}`);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-slate-600">per page</span>
      </div>
    </div>
  );
}
