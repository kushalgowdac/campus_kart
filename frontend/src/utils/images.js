const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

export const resolveImageUrl = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isAbsoluteUrl(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  const sanitized = trimmed.replace(/^\/+/, "").replace(/^images\//i, "");
  return `${API_BASE}/images/${sanitized}`;
};
