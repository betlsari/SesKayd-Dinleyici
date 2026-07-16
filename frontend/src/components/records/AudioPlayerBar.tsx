import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Download, X } from "lucide-react";
import type { CallRecord } from "../../types/record";
import "./AudioPlayerBar.css";

interface AudioPlayerBarProps {
  record: CallRecord;
  onClose: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

export default function AudioPlayerBar({
  record,
  onClose,
}: AudioPlayerBarProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= record.durationSeconds) {
          setIsPlaying(false);
          return record.durationSeconds;
        }

        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, record.durationSeconds]);

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    setElapsed(Number(event.target.value));
  }

  function handleDownload() {
    console.log("İndirilecek kayıt:", record.id);
  }

  return (
    <div className="audio-player-bar">
      <div className="audio-player-info">
        <span className="audio-player-caller">{record.callerNumber}</span>

        <span className="audio-player-meta">
          {record.dateTime} · {record.agentEmail}
        </span>
      </div>

      <div className="audio-player-controls">
        <button
          type="button"
          className="audio-player-toggle"
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label={isPlaying ? "Duraklat" : "Oynat"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <span className="audio-player-time">{formatTime(elapsed)}</span>

        <input
          type="range"
          className="audio-player-progress"
          min={0}
          max={record.durationSeconds}
          value={elapsed}
          onChange={handleSeek}
          aria-label="Kayıt ilerleme çubuğu"
        />

        <span className="audio-player-time">
          {formatTime(record.durationSeconds)}
        </span>
      </div>

      <div className="audio-player-actions">
        <button
          type="button"
          className="icon-button-small"
          aria-label="Ses seviyesi"
        >
          <Volume2 size={16} />
        </button>

        <button
          type="button"
          className="icon-button-small"
          aria-label="Kaydı indir"
          onClick={handleDownload}
        >
          <Download size={16} />
        </button>

        <button
          type="button"
          className="icon-button-small"
          aria-label="Oynatıcıyı kapat"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
