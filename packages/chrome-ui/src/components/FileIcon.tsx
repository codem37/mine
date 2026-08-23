import type { JSX } from "react";

interface Props {
  readonly filename: string;
  readonly isTorrent?: boolean;
}

export function FileIcon({ filename, isTorrent }: Props): JSX.Element {
  if (isTorrent || filename.endsWith(".torrent")) {
    return <span className="file-icon file-icon--torrent" title="Torrent">⚡</span>;
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (["pdf"].includes(ext)) {
    return <span className="file-icon file-icon--pdf" title="PDF Document">📄</span>;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) {
    return <span className="file-icon file-icon--image" title="Image">🖼</span>;
  }
  if (["mp4", "mkv", "webm", "avi", "mov", "flv", "m3u8"].includes(ext)) {
    return <span className="file-icon file-icon--video" title="Video">🎬</span>;
  }
  if (["zip", "tar", "gz", "7z", "rar", "bz2", "xz"].includes(ext)) {
    return <span className="file-icon file-icon--archive" title="Archive">📦</span>;
  }
  if (["exe", "msi", "appimage", "dmg", "deb", "rpm"].includes(ext)) {
    return <span className="file-icon file-icon--program" title="Program">⚙</span>;
  }
  if (["iso", "img", "vhd", "qcow2"].includes(ext)) {
    return <span className="file-icon file-icon--iso" title="Disk Image">💿</span>;
  }
  if (["doc", "docx", "txt", "md", "rtf", "odt"].includes(ext)) {
    return <span className="file-icon file-icon--doc" title="Document">📝</span>;
  }

  return <span className="file-icon file-icon--generic" title="File">📁</span>;
}
