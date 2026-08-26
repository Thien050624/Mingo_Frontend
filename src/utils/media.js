const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogv"];

export function isVideoUrl(url) {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

export function isVideoFile(file) {
  return !!file?.type?.startsWith("video/");
}
