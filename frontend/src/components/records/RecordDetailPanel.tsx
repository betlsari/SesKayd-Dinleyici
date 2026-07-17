import type { CallRecord } from "../../types/record";
import CallInfoCard from "./CallInfoCard";
import AudioRecordingCard from "./AudioRecordingCard";
import "./RecordDetailPanel.css";

interface RecordDetailPanelProps {
  record: CallRecord;
  autoPlay: boolean;
  // Kayıt Detayları içindeki "önceki/sonraki kayıt" gezinmesi.
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

// NOT: Burada KASITLI olarak bir canDownload prop'u YOK. İndirme, rol
// bazlı bile olsa artık hiçbir şekilde desteklenmiyor (bkz.
// AudioRecordingCard.tsx başındaki backend güvenlik notları).
export default function RecordDetailPanel({
  record,
  autoPlay,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: RecordDetailPanelProps) {
  return (
    <div className="record-detail-columns">
      <CallInfoCard record={record} />
      {/*
        key={record.id}: kayıt değişince (önceki/sonraki geçişinde)
        AudioRecordingCard'ı tamamen yeniden mount ediyoruz. Böylece
        elapsed/isPlaying/selection gibi state'ler otomatik sıfırlanır,
        bunu ayrı bir useEffect ile elle yapmaya gerek kalmaz.
      */}
      <AudioRecordingCard
        key={record.id}
        record={record}
        autoPlay={autoPlay}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
