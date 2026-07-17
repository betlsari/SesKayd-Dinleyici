import { useState, useRef, useEffect } from "react";
import {
  Play,
  Info,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import type { CallRecord } from "../../types/record";
import "./RecordsTable.css";

interface RecordsTableProps {
  records: CallRecord[];
  totalCount: number;
  sortDirection: "asc" | "desc" | null;
  onSortToggle: () => void;
  onPlay: (record: CallRecord) => void;
  onOpenDetail: (record: CallRecord) => void;
  onDelete?: (record: CallRecord) => void;
  // Silme UI'ının (üç nokta menüsü + "Sil" öğesi) gösterilip
  // gösterilmeyeceğini belirler. Bu SADECE görünürlük içindir,
  // gerçek yetki kontrolü RecordsPage.handleDelete içinde de
  // TEKRAR yapılır (bkz. auth/permissions.ts canDeleteRecords).
  canDelete: boolean;
}

// Saniyeyi "04:32" gibi mm:ss formatına çeviriyoruz.
function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function RecordsTable({
  records,
  totalCount,
  sortDirection,
  onSortToggle,
  onPlay,
  onOpenDetail,
  onDelete = () => {},
  canDelete,
}: RecordsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  // Açık menü içindeki öğe butonları — ok tuşlarıyla gezinmek için.
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // "..." menüsü açıkken dışarı tıklanırsa kapanmasını sağlıyoruz.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (openMenuId !== null) {
      menuItemRefs.current[0]?.focus();
    }
  }, [openMenuId]);

  function closeMenu() {
    setOpenMenuId(null);
    menuTriggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    const items = menuItemRefs.current.filter((el): el is HTMLButtonElement =>
      Boolean(el),
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "ArrowDown": {
        event.preventDefault();
        const nextIndex =
          currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prevIndex =
          currentIndex < 0
            ? items.length - 1
            : (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
        break;
      }
      default:
        break;
    }
  }

  const SortIcon =
    sortDirection === "asc"
      ? ArrowUp
      : sortDirection === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <div className="records-table-wrapper">
      <div className="records-table-header">
        <h2>Kayıt Listesi</h2>
        <span className="records-count">({totalCount} kayıt)</span>
      </div>

      <table className="records-table">
        <thead>
          <tr>
            <th aria-label="Oynat" />
            <th>
              <button
                type="button"
                className="sortable-header"
                onClick={onSortToggle}
              >
                Tarih / Saat
                <SortIcon size={13} />
              </button>
            </th>
            <th>Arayan</th>
            <th>Aranan</th>
            <th>Agent</th>
            <th>Kullanıcı Adı</th>
            <th>Süre</th>
            <th>Çağrı ID</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={9} className="records-empty">
                Filtrelerinize uyan kayıt bulunamadı.
              </td>
            </tr>
          )}

          {records.map((record) => {
            const isMenuOpen = openMenuId === record.id;

            return (
              <tr key={record.id} onDoubleClick={() => onOpenDetail(record)}>
                <td>
                  <button
                    type="button"
                    className="play-button"
                    onClick={() => onPlay(record)}
                    aria-label="Kaydı dinle"
                  >
                    <Play size={14} />
                  </button>
                </td>
                <td>{record.dateTime}</td>
                <td>{record.callerNumber}</td>
                <td>{record.calledNumber}</td>
                <td>{record.agentName}</td>
                <td>{record.username}</td>
                <td>{formatDuration(record.durationSeconds)}</td>
                <td>{record.callId}</td>
                <td>
                  <div className="records-row-actions">
                    <button
                      type="button"
                      className="icon-button-small"
                      onClick={() => onOpenDetail(record)}
                      aria-label="Kayıt detayını aç"
                    >
                      <Info size={16} />
                    </button>

                    {}
                    {canDelete && (
                      <div
                        className="row-menu"
                        ref={isMenuOpen ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          ref={isMenuOpen ? menuTriggerRef : undefined}
                          className="icon-button-small"
                          aria-label="Diğer işlemler"
                          aria-haspopup="menu"
                          aria-expanded={isMenuOpen}
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === record.id ? null : record.id,
                            )
                          }
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {isMenuOpen && (
                          <ul
                            className="row-menu-dropdown"
                            role="menu"
                            onKeyDown={handleMenuKeyDown}
                          >
                            <li role="none">
                              <button
                                type="button"
                                role="menuitem"
                                ref={(el) => {
                                  menuItemRefs.current[0] = el;
                                }}
                                className="row-menu-danger"
                                onClick={() => {
                                  onDelete(record);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 size={14} />
                                Sil
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
