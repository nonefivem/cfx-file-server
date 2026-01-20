import type { IncomingMessage, ServerResponse } from "http";
import { config } from "../config";

export function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin || "*";
  if (
    config.security.trustedOrigins.includes("*") ||
    config.security.trustedOrigins.includes(origin)
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function getClientIp(req: IncomingMessage): string | undefined {
  const addr =
    (req as any).connection?.remoteAddress || (req as any).socket?.remoteAddress;
  return addr?.split(":")[0];
}

export function json(res: ServerResponse, status: number, data: object): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
