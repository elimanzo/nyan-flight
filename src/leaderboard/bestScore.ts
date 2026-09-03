const SCORE_NAMESPACE = "__nf_v1__";

// djb2 variant — deters casual DevTools tampering, not cryptographically secure
function checksum(n: number): string {
  let hash = 5381;
  const s = `${n}${SCORE_NAMESPACE}`;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36);
}

/** Read best score from localStorage; returns 0 if absent or tampered. */
export function readBestScore(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem("nyan-best-score");
  if (!raw) return 0;
  const sep = raw.lastIndexOf(":");
  if (sep === -1) return 0;
  const n = Number.parseInt(raw.slice(0, sep), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return checksum(n) === raw.slice(sep + 1) ? n : 0;
}

/** Write best score to localStorage with tamper-detection checksum. */
export function writeBestScore(n: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("nyan-best-score", `${n}:${checksum(n)}`);
}
