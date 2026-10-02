// In-memory sliding window rate limiter fallback
const rateLimitMap = new Map<string, number[]>();

export function allowRequest(key: string, limit: number = 10, windowMs: number = 60_000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recent = timestamps.filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}
