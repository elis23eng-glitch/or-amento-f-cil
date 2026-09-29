import { getRequest } from "@tanstack/react-start/server";

/** Origem pública real da aplicação (nunca localhost/blob). */
export function requestOrigin(): string {
  const req = getRequest();
  const url = new URL(req.url);
  const forwarded = req.headers.get("x-forwarded-host");
  if (url.hostname === "localhost" && forwarded) return `https://${forwarded}`;
  return url.origin;
}
