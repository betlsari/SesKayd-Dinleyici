import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Çok fazla sayfa varsa hepsini göstermek yerine
// 1 ... 4 5 6 ... 12 gibi kısaltılmış bir liste üretiyoruz.
function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="pagination-wrapper">
      <nav className="pagination" aria-label="Sayfalama">
        <button
          type="button"
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Önceki sayfa"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={
                "pagination-page" + (page === currentPage ? " is-active" : "")
              }
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Sonraki sayfa"
        >
          <ChevronRight size={16} />
        </button>
      </nav>

      <span className="pagination-total">
        Sayfa {currentPage} / {totalPages}
      </span>
    </div>
  );
}
