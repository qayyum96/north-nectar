/**
 * Where to go after signing in (?next=), limited to paths inside the admin. Browsers treat
 * "/\evil.com" and paths with tabs or newlines like "//evil.com", so anything with a backslash,
 * whitespace or control character is refused, and the result must resolve to the same origin.
 */
export function safeNext(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  if (/[\\\s\p{Cc}]/u.test(next)) return "/";
  try {
    const base = "http://admin.invalid";
    const url = new URL(next, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
