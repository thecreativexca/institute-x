"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage }: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    return `/office/quizzes?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showEllipsisStart = currentPage > 4;
  const showEllipsisEnd = currentPage < totalPages - 3;

  return (
    <nav className="flex items-center justify-between py-4 border-t border-slate-200" aria-label="Pagination">
      <div className="text-sm text-slate-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
      </div>
      <div className="flex items-center gap-1">
        <Link
          href={createPageUrl(currentPage - 1)}
          className={cn(
            "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
            currentPage === 1
              ? "border-slate-300 text-slate-400 cursor-not-allowed"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
          aria-label="Previous page"
          aria-disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Link>

        <div className="flex items-center gap-1 mx-2">
          {showEllipsisStart && (
            <>
              <Link
                href={createPageUrl(1)}
                className="px-3 py-2 text-sm font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                1
              </Link>
              <span className="px-2 text-slate-400">...</span>
            </>
          )}

          {pages
            .filter((page) => {
              if (page === 1 || page === totalPages) return true;
              if (page >= currentPage - 1 && page <= currentPage + 1) return true;
              return false;
            })
            .map((page) => (
              <Link
                key={page}
                href={createPageUrl(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                  page === currentPage
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Link>
            ))}

          {showEllipsisEnd && (
            <>
              <span className="px-2 text-slate-400">...</span>
              <Link
                href={createPageUrl(totalPages)}
                className="px-3 py-2 text-sm font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {totalPages}
              </Link>
            </>
          )}
        </div>

        <Link
          href={createPageUrl(currentPage + 1)}
          className={cn(
            "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
            currentPage === totalPages
              ? "border-slate-300 text-slate-400 cursor-not-allowed"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
          aria-label="Next page"
          aria-disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}