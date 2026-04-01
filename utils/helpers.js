export function formatNum(n) {
  if (n === undefined || n === null) return "?";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export function timeAgo(utcSeconds) {
  if (!utcSeconds) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - utcSeconds;
  if (diff < 60) return "now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  if (diff < 604800) return Math.floor(diff / 86400) + "d";
  return Math.floor(diff / 604800) + "w";
}

export function decodeEntities(text) {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Estimate text height for layout calculations.
 * Uses hmUI.getTextLayout when available, falls back to estimation.
 */
export function measureTextHeight(hmUI, text, fontSize, maxWidth) {
  try {
    const layout = hmUI.getTextLayout(text, {
      text_size: fontSize,
      text_width: maxWidth,
    });
    return layout.height;
  } catch (e) {
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
    const lines = Math.ceil((text || " ").length / Math.max(charsPerLine, 1));
    return Math.max(lines, 1) * Math.ceil(fontSize * 1.4);
  }
}
