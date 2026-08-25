import { FaFileAlt, FaDownload } from "react-icons/fa";
import { formatFileSize } from "../../utils/file";

export default function MessageAttachment({ file, compact = false }) {
  if (!file) return null;

  if (file.type?.startsWith("video/")) {
    return (
      <video
        src={file.url}
        controls
        className={`${compact ? "max-w-[160px]" : "max-w-[220px]"} rounded-2xl border border-zm-border mb-1`}
      />
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      download={file.name}
      className={`flex items-center gap-2 rounded-xl border border-zm-border bg-zm-card hover:bg-zm-hover transition-colors mb-1 ${
        compact ? "p-1.5 max-w-[160px]" : "p-2 max-w-[220px]"
      }`}
    >
      <FaFileAlt className="text-zm-blue-light shrink-0" size={compact ? 16 : 20} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${compact ? "text-[11px]" : "text-xs"}`}>{file.name}</p>
        <p className="text-[10px] text-zm-muted">{formatFileSize(file.size)}</p>
      </div>
      <FaDownload className="text-zm-muted shrink-0" size={compact ? 10 : 12} aria-hidden="true" />
    </a>
  );
}
