import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  Download,
} from "lucide-react";
import type { CallRecord } from "../../types/record";
import "./AudioRecordingCard.css";

interface AudioRecordingCardProps {
  record: CallRecord;
  autoPlay: boolean;
}

// Saniyeyi "04:32" gibi mm:ss formatına çeviriyoruz.
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Backend'in üreteceği dosya adlandırma kuralını mock'luyoruz.
function buildFileName(record: CallRecord): string {
  const [datePart, timePart] = record.dateTime.split(" ");
  const [day, month, year] = datePart.split(".");
  const compactDate = `${year}${month}${day}`;
  const compactTime = timePart.replace(":", "") + "00";
  const shortCallId = record.callId.replace("CALL-", "");
  return `recording_${record.callerNumber}_${record.calledNumber}_${record.agentEmail}_${record.username}_${compactDate}_${compactTime}_${shortCallId}.${record.format.toLowerCase()}`;
}

// Dalga formu görünümü için sabit (deterministik) ama rastgele görünen çubuklar
// üretiyoruz. Gerçek ses dosyası bağlanınca bu, decode edilen audio buffer'dan
// hesaplanacak (TODO: backend entegrasyonu).
function buildWaveformBars(count: number): number[] {
  let seed = 42;
  return Array.from({ length: count }, () => {
    seed = (seed * 9301 + 49297) % 233280;
    const rand = seed / 233280;
    return 6 + Math.round(rand * 26);
  });
}

const WAVEFORM_BAR_COUNT = 90;

export default function AudioRecordingCard({
  record,
  autoPlay,
}: AudioRecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformBars = useMemo(() => buildWaveformBars(WAVEFORM_BAR_COUNT), []);

  // Oynatım simülasyonu: gerçek <audio> elementi bağlanana kadar saniyeyi
  // elle ilerletiyoruz. TODO: backend hazır olunca <audio> + timeupdate'e geçilecek.
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= record.durationSeconds) {
            setIsPlaying(false);
            return record.durationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, record.durationSeconds]);

  function seekBy(deltaSeconds: number) {
    setElapsed((prev) =>
      Math.min(record.durationSeconds, Math.max(0, prev + deltaSeconds)),
    );
  }

  function handleDownload() {
    // TODO: .NET API'den kayıt dosyasını indirme (örn. GET /api/records/{id}/download)
    console.log("İndirilecek kayıt:", record.id);
  }

  const progressRatio = elapsed / record.durationSeconds;

  return (
    <div className="audio-recording-card">
      <div className="audio-recording-header">
        <h2>Ses Kaydı</h2>
        <button
          type="button"
          className="icon-button-small"
          aria-label="Kaydı indir"
          onClick={handleDownload}
        >
          <Download size={16} />
        </button>
      </div>

      <p className="audio-recording-filename">{buildFileName(record)}</p>

      <div className="waveform" aria-hidden="true">
        {waveformBars.map((height, index) => (
          <span
            key={index}
            className={
              "waveform-bar" +
              (index / WAVEFORM_BAR_COUNT <= progressRatio ? " is-played" : "")
            }
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      <div className="audio-recording-controls">
        <div className="playback-controls">
          <button
            type="button"
            className="skip-button"
            onClick={() => seekBy(-10)}
            aria-label="10 saniye geri sar"
          >
            <RotateCcw size={15} />
            <span>10s</span>
          </button>
          <button
            type="button"
            className="icon-button-small"
            onClick={() => setElapsed(0)}
            aria-label="Başa sar"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className="audio-play-toggle"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? "Duraklat" : "Oynat"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            className="icon-button-small"
            onClick={() => setElapsed(record.durationSeconds)}
            aria-label="Sona sar"
          >
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            className="skip-button"
            onClick={() => seekBy(10)}
            aria-label="10 saniye ileri sar"
          >
            <RotateCw size={15} />
            <span>10s</span>
          </button>
        </div>

        <div className="secondary-controls">
          <span className="audio-recording-time">
            {formatTime(elapsed)} / {formatTime(record.durationSeconds)}
          </span>
          <Volume2 size={16} className="volume-icon" aria-hidden="true" />
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={100}
            defaultValue={80}
            aria-label="Ses seviyesi"
          />
        </div>
      </div>

      <div className="listen-logs">
        <h3>Dinleme Logları</h3>
        <table className="listen-logs-table">
          <thead>
            <tr>
              <th>Tarih / Saat</th>
              <th>Kullanıcı</th>
              <th>Rol</th>
              <th>İşlem</th>
              <th>IP Adresi</th>
            </tr>
          </thead>
          <tbody>
            {record.listenLogs.map((log) => (
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
    </div>
  );
}
