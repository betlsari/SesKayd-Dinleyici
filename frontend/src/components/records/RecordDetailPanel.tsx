import type { CallRecord } from "../../types/record";
import CallInfoCard from "./CallInfoCard";
import AudioRecordingCard from "./AudioRecordingCard";
import "./RecordDetailPanel.css";

interface RecordDetailPanelProps {
  record: CallRecord;
  autoPlay: boolean;
}

export default function RecordDetailPanel({
  record,
  autoPlay,
}: RecordDetailPanelProps) {
  return (
    <div className="record-detail-columns">
      <CallInfoCard record={record} />
      <AudioRecordingCard record={record} autoPlay={autoPlay} />
    </div>
  );
}
