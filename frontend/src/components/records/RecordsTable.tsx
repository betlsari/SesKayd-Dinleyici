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
}

// Saniyeyi "04:32" gibi mm:ss formatına çeviriyoruz.
function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// NOT: Bu tabloda ve satır menüsünde KASITLI olarak bir "İndir" aksiyonu
// YOK. Ses kayıtları hiçbir kullanıcı rolü için indirilebilir değildir
// (bkz. AudioRecordingCard.tsx başındaki backend güvenlik notları).
// Buraya tekrar bir indirme butonu/menü öğesi eklenmemeli.
export default function RecordsTable({
  records,
  totalCount,
  sortDirection,
  onSortToggle,
  onPlay,
  onOpenDetail,
  onDelete = () => {},
}: RecordsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

          {records.map((record) => (
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

                  <div
                    className="row-menu"
                    ref={openMenuId === record.id ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      className="icon-button-small"
                      aria-label="Diğer işlemler"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === record.id}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === record.id ? null : record.id,
                        )
                      }
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {openMenuId === record.id && (
                      <ul className="row-menu-dropdown" role="menu">
                        <li role="none">
                          <button
                            type="button"
                            role="menuitem"
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
