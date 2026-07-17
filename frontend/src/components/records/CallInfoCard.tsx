import type { CallRecord } from "../../types/record";
import "./CallInfoCard.css";

interface CallInfoCardProps {
  record: CallRecord;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function CallInfoCard({ record }: CallInfoCardProps) {
  return (
    <div className="call-info-card">
      <div className="call-info-header">
        <h2>Çağrı Bilgileri</h2>
      </div>

      <div className="call-info-grid">
        <div className="detail-field">
          <span className="detail-label">Şirket</span>
          <span className="detail-value">{record.company}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Arayan Numara</span>
          <span className="detail-value">{record.callerNumber}</span>
        </div>

        <div className="detail-field">
          <span className="detail-label">Aranan Numara</span>
          <span className="detail-value">{record.calledNumber}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Agent</span>
          <span className="detail-value">{record.agentName}</span>
        </div>

        <div className="detail-field">
          <span className="detail-label">Agent E-posta</span>
          <span className="detail-value">{record.agentEmail}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Kullanıcı Adı</span>
          <span className="detail-value">{record.username}</span>
        </div>

        <div className="detail-field">
          <span className="detail-label">Çağrı ID</span>
          <span className="detail-value">{record.callId}</span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Tarih / Saat</span>
          <span className="detail-value">{record.dateTime}</span>
        </div>

        <div className="detail-field">
          <span className="detail-label">Süre</span>
          <span className="detail-value">
            {formatDuration(record.durationSeconds)}
          </span>
        </div>
        <div className="detail-field">
          <span className="detail-label">Dosya Boyutu</span>
          <span className="detail-value">{record.fileSizeKB} KB</span>
        </div>

        <div className="detail-field">
          <span className="detail-label">Format</span>
          <span className="detail-value">{record.format}</span>
        </div>
      </div>
    </div>
  );
}
