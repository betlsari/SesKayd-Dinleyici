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
  ChevronLeft,
  ChevronRight,
  Repeat,
  X,
} from "lucide-react";
import type { CallRecord } from "../../types/record";
import ListenLogsTable from "./ListenLogsTable";
import "./AudioRecordingCard.css";

interface AudioRecordingCardProps {
  record: CallRecord;
  autoPlay: boolean;
  canDownload: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
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

// NOT: Bu bileşen, RecordDetailPanel içinde `key={record.id}` ile render
// ediliyor. Böylece "önceki/sonraki kayıt" geçişinde bileşen tamamen yeniden
// mount olur ve tüm state'ler (elapsed, isPlaying, selection...) otomatik
// olarak sıfırlanır — bunu bir useEffect içinde elle yapmaya gerek kalmaz.
export default function AudioRecordingCard({
  record,
  autoPlay,
  canDownload,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: AudioRecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [elapsed, setElapsed] = useState(0);
  // Seçili aralık (loop/vurgu bölgesi), bar index'i olarak tutulur (0..WAVEFORM_BAR_COUNT)
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveformBars = useMemo(() => buildWaveformBars(WAVEFORM_BAR_COUNT), []);

  // Oynatım simülasyonu: gerçek <audio> elementi bağlanana kadar saniyeyi
  // elle ilerletiyoruz. TODO: backend hazır olunca <audio> + timeupdate'e geçilecek.
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const loopStartSec = selection
            ? (selection.start / WAVEFORM_BAR_COUNT) * record.durationSeconds
            : 0;
          const loopEndSec = selection
            ? (selection.end / WAVEFORM_BAR_COUNT) * record.durationSeconds
            : record.durationSeconds;

          const upperBound =
            loopEnabled && selection ? loopEndSec : record.durationSeconds;
          const next = prev + 1;

          if (next >= upperBound) {
            if (loopEnabled && selection) {
              return loopStartSec;
            }
            setIsPlaying(false);
            return upperBound;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, record.durationSeconds, selection, loopEnabled]);

  function seekBy(deltaSeconds: number) {
    setElapsed((prev) =>
      Math.min(record.durationSeconds, Math.max(0, prev + deltaSeconds)),
    );
  }

  function handleDownload() {
    if (!canDownload) return;
    // TODO: .NET API'den kayıt dosyasını indirme (örn. GET /api/records/{id}/download)
    console.log("İndirilecek kayıt:", record.id);
  }

  function barIndexFromEvent(event: React.MouseEvent<HTMLDivElement>): number {
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    return Math.round(ratio * WAVEFORM_BAR_COUNT);
  }

  function handleWaveformMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const index = barIndexFromEvent(event);
    setIsDragging(true);
    setSelection({ start: index, end: index });
  }

  function handleWaveformMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const index = barIndexFromEvent(event);
    setSelection((prev) => (prev ? { start: prev.start, end: index } : null));
  }

  function finishDragIfTrivial() {
    setIsDragging(false);
    setSelection((prev) => {
      if (!prev) return null;
      // Tek noktaya tıklama = seçim yok, sadece o konuma sar.
      if (Math.abs(prev.end - prev.start) < 1) return null;
      return prev;
    });
  }

  function clearSelection() {
    setSelection(null);
    setLoopEnabled(false);
  }

  const selectionRange = selection
    ? {
        from: Math.min(selection.start, selection.end),
        to: Math.max(selection.start, selection.end),
      }
    : null;

  const progressRatio = elapsed / record.durationSeconds;
  const progressBarIndex = progressRatio * WAVEFORM_BAR_COUNT;

  const selectionStartSec = selectionRange
    ? (selectionRange.from / WAVEFORM_BAR_COUNT) * record.durationSeconds
    : null;
  const selectionEndSec = selectionRange
    ? (selectionRange.to / WAVEFORM_BAR_COUNT) * record.durationSeconds
    : null;

  return (
    <div className="audio-recording-card">
      <div className="audio-recording-header">
        <h2>Ses Kaydı</h2>
        <button
          type="button"
          className="icon-button-small"
          aria-label="Kaydı indir"
          disabled={!canDownload}
          title={canDownload ? "Kaydı indir" : "İndirme yetkiniz yok"}
          onClick={handleDownload}
        >
          <Download size={16} />
        </button>
      </div>

      <p className="audio-recording-filename">{buildFileName(record)}</p>

      <div
        className="waveform"
        ref={waveformRef}
        onMouseDown={handleWaveformMouseDown}
        onMouseMove={handleWaveformMouseMove}
        onMouseUp={finishDragIfTrivial}
        onMouseLeave={() => isDragging && finishDragIfTrivial()}
      >
        {waveformBars.map((height, index) => {
          const isPlayed = index <= progressBarIndex;
          const isSelected =
            selectionRange &&
            index >= selectionRange.from &&
            index <= selectionRange.to;
          return (
            <span
              key={index}
              className={
                "waveform-bar" +
                (isSelected ? " is-selected" : "") +
                (isPlayed ? " is-played" : "")
              }
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {selectionRange && (
        <div className="waveform-selection-bar">
          <span>
            Seçili aralık: {formatTime(selectionStartSec ?? 0)} –{" "}
            {formatTime(selectionEndSec ?? 0)}
          </span>
          <button
            type="button"
            className={
              "selection-loop-toggle" + (loopEnabled ? " is-active" : "")
            }
            onClick={() => setLoopEnabled((prev) => !prev)}
          >
            <Repeat size={13} />
            Döngü
          </button>
          <button
            type="button"
            className="selection-clear"
            onClick={clearSelection}
          >
            <X size={13} />
            Temizle
          </button>
        </div>
      )}

      <div className="audio-recording-controls">
        <div className="playback-controls">
          <button
            type="button"
            className="icon-button-small"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Önceki kayıt"
            title="Önceki kayıt"
          >
            <ChevronLeft size={16} />
          </button>

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

          <button
            type="button"
            className="icon-button-small"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Sonraki kayıt"
            title="Sonraki kayıt"
          >
            <ChevronRight size={16} />
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

      {/*
        Dinleme logları artık kaydın kendi verisi değil; audit log
        sisteminden read-only olarak ayrı çekiliyor (bkz. auditLogService.ts).
      */}
      <ListenLogsTable recordId={record.id} />
    </div>
  );
}
