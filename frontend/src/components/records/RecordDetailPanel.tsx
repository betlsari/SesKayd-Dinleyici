import type { CallRecord } from "../../types/record";
import CallInfoCard from "./CallInfoCard";
import AudioRecordingCard from "./AudioRecordingCard";
import "./RecordDetailPanel.css";

interface RecordDetailPanelProps {
  record: CallRecord;
  autoPlay: boolean;
  // Kullanıcının kayıt dosyalarını indirme yetkisi var mı?
  canDownload: boolean;
  // Kayıt Detayları içindeki "önceki/sonraki kayıt" gezinmesi.
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function RecordDetailPanel({
  record,
  autoPlay,
  canDownload,
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
        canDownload={canDownload}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
