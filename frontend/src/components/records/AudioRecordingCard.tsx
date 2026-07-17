import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  X,
} from "lucide-react";
import type { CallRecord } from "../../types/record";
import ListenLogsTable from "./ListenLogsTable";
import { reportListenEvent } from "../../services/auditLogService";
import "./AudioRecordingCard.css";

interface AudioRecordingCardProps {
  record: CallRecord;
  autoPlay: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// recordId'den basit, deterministik bir sayısal seed türetiyoruz
// (örn. "rec-12" -> 12). auditLogService.ts'teki seedFromRecordId ile
// aynı yaklaşım — burada tekrar tanımlıyoruz çünkü bu iki dosyanın
// birbirine bağımlı olmasını istemiyoruz (audit log ve waveform
// tamamen ayrı kavramlar, sadece "id'den deterministik sayı üretme"
// tekniğini paylaşıyorlar).
function seedFromRecordId(recordId: string): number {
  return Number(recordId.replace(/\D/g, "")) || 1;
}

// Dalga formu görünümü için deterministik ama rastgele görünen çubuklar
// üretiyoruz. Seed, kayıt id'sinden türetiliyor ki HER KAYIT kendine
// özgü (ama sayfa yeniden render olsa da değişmeyen) bir waveform
// şekline sahip olsun. Gerçek ses dosyası bağlanınca bu, decode edilen
// audio buffer'dan hesaplanacak (TODO: backend entegrasyonu).
function buildWaveformBars(count: number, seed: number): number[] {
  let value = seed;
  return Array.from({ length: count }, () => {
    value = (value * 9301 + 49297) % 233280;
    const rand = value / 233280;
    return 6 + Math.round(rand * 26);
  });
}

const WAVEFORM_BAR_COUNT = 90;
// Klavye ile ok tuşlarında ne kadar ileri/geri sarılacağı (saniye).
const KEYBOARD_SEEK_SECONDS = 5;

export default function AudioRecordingCard({
  record,
  autoPlay,
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
  const waveformBars = useMemo(
    () => buildWaveformBars(WAVEFORM_BAR_COUNT, seedFromRecordId(record.id)),
    [record.id],
  );

  const hasReportedListenRef = useRef(false);

  useEffect(() => {
    if (isPlaying) {
      if (!hasReportedListenRef.current) {
        hasReportedListenRef.current = true;
        reportListenEvent(record.id, "Dinleme");
      }

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
  }, [isPlaying, record.id, record.durationSeconds, selection, loopEnabled]);

  function seekBy(deltaSeconds: number) {
    setElapsed((prev) =>
      Math.min(record.durationSeconds, Math.max(0, prev + deltaSeconds)),
    );
  }

  // Hem mouse hem touch event'lerinden gelen clientX'i, waveform üzerindeki
  // bir bar index'ine çeviren ortak fonksiyon. Böylece mouse ve touch
  // handler'ları aynı hesaplama mantığını paylaşır, kopyalanmaz.
  function barIndexFromClientX(clientX: number): number {
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * WAVEFORM_BAR_COUNT);
  }

  function beginSelectionAt(clientX: number) {
    const index = barIndexFromClientX(clientX);
    setIsDragging(true);
    setSelection({ start: index, end: index });
  }

  function updateSelectionAt(clientX: number) {
    if (!isDragging) return;
    const index = barIndexFromClientX(clientX);
    setSelection((prev) => (prev ? { start: prev.start, end: index } : null));
  }

  // ---- Mouse (masaüstü) ----
  function handleWaveformMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    beginSelectionAt(event.clientX);
  }

  function handleWaveformMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    updateSelectionAt(event.clientX);
  }

  // ---- Touch (dokunmatik ekran) ----
  // Not: .waveform üzerindeki `touch-action: none` (bkz. CSS) sayesinde
  // burada preventDefault() çağırmamıza gerek kalmadan sayfa kaymıyor.
  function handleWaveformTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    beginSelectionAt(touch.clientX);
  }

  function handleWaveformTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    updateSelectionAt(touch.clientX);
  }

  function finishDragIfTrivial() {
    setIsDragging(false);
    setSelection((prev) => {
      if (!prev) return null;
      // Tek noktaya tıklama/dokunma = seçim yok, sadece o konuma sar.
      if (Math.abs(prev.end - prev.start) < 1) return null;
      return prev;
    });
  }

  function clearSelection() {
    setSelection(null);
    setLoopEnabled(false);
  }

  // ---- Klavye ----
  // Waveform, tabIndex={0} + role="slider" ile klavye odağı alabiliyor.
  // Bu, mouse/touch'a erişimi olmayan kullanıcıların da zaman çizelgesinde
  // gezinebilmesini ve oynatmayı kontrol edebilmesini sağlar.
  function handleWaveformKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        seekBy(KEYBOARD_SEEK_SECONDS);
        break;
      case "ArrowLeft":
        event.preventDefault();
        seekBy(-KEYBOARD_SEEK_SECONDS);
        break;
      case "Home":
        event.preventDefault();
        setElapsed(0);
        break;
      case "End":
        event.preventDefault();
        setElapsed(record.durationSeconds);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        setIsPlaying((prev) => !prev);
        break;
      case "Escape":
        if (selection) {
          event.preventDefault();
          clearSelection();
        }
        break;
      default:
        break;
    }
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
      </div>

      <div
        className="waveform"
        ref={waveformRef}
        tabIndex={0}
        role="slider"
        aria-orientation="horizontal"
        aria-label="Ses kaydı zaman çizelgesi"
        aria-valuemin={0}
        aria-valuemax={record.durationSeconds}
        aria-valuenow={Math.round(elapsed)}
        aria-valuetext={`${formatTime(elapsed)} / ${formatTime(record.durationSeconds)}`}
        onContextMenu={(event) => event.preventDefault()}
        onMouseDown={handleWaveformMouseDown}
        onMouseMove={handleWaveformMouseMove}
        onMouseUp={finishDragIfTrivial}
        onMouseLeave={() => isDragging && finishDragIfTrivial()}
        onTouchStart={handleWaveformTouchStart}
        onTouchMove={handleWaveformTouchMove}
        onTouchEnd={finishDragIfTrivial}
        onTouchCancel={finishDragIfTrivial}
        onKeyDown={handleWaveformKeyDown}
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

      {}
      <ListenLogsTable recordId={record.id} />
    </div>
  );
}
