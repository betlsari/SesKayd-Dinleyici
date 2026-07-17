import type { CallRecord } from "../../types/record";
import CallInfoCard from "./CallInfoCard";
import AudioRecordingCard from "./AudioRecordingCard";
import "./RecordDetailPanel.css";

interface RecordDetailPanelProps {
  record: CallRecord;
  autoPlay: boolean;

  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

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
      {}
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
