import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import type { ListenLog } from "../../types/record";
import { fetchListenLogs } from "../../services/auditLogService";
import "./ListenLogsTable.css";

interface ListenLogsTableProps {
  recordId: string;
}

type SortDirection = "asc" | "desc";
type LoadStatus = "loading" | "ready" | "error";

function parseLogDateTime(value: string): number {
  const [datePart, timePart = "00:00:00"] = value.split(" ");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second || 0).getTime();
}

export default function ListenLogsTable({ recordId }: ListenLogsTableProps) {
  const [logs, setLogs] = useState<ListenLog[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    let cancelled = false;

    fetchListenLogs(recordId)
      .then((result) => {
        if (cancelled) return;
        setLogs(result);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [recordId]);

  function handleSortToggle() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  const sortedLogs = [...logs].sort((a, b) => {
    const diff = parseLogDateTime(a.dateTime) - parseLogDateTime(b.dateTime);
    return sortDirection === "asc" ? diff : -diff;
  });

  const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="listen-logs">
      <h3>Dinleme Logları</h3>

      <table className="listen-logs-table">
        <thead>
          <tr>
            <th>
              <button
                type="button"
                className="sortable-header"
                onClick={handleSortToggle}
                aria-label="Tarih / Saate göre sırala"
              >
                Tarih / Saat
                <SortIcon size={12} />
              </button>
            </th>
            <th>Kullanıcı</th>
            <th>Rol</th>
            <th>İşlem</th>
            <th>IP Adresi</th>
          </tr>
        </thead>
        <tbody>
          {status === "loading" && (
            <tr>
              <td colSpan={5} className="listen-logs-status">
                Yükleniyor...
              </td>
            </tr>
          )}

          {status === "error" && (
            <tr>
              <td colSpan={5} className="listen-logs-status listen-logs-error">
                <AlertCircle size={14} />
                Dinleme logları alınamadı. Lütfen tekrar deneyin.
              </td>
            </tr>
          )}

          {status === "ready" && sortedLogs.length === 0 && (
            <tr>
              <td colSpan={5} className="listen-logs-status">
                Bu kayıt için henüz dinleme logu bulunmuyor.
              </td>
            </tr>
          )}

          {status === "ready" &&
            sortedLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.dateTime}</td>
                <td>{log.user}</td>
                <td>{log.role}</td>
                <td>{log.action}</td>
                <td>{log.ipAddress}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
