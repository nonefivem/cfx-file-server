//@ts-ignore - No declarations available
import { setHttpCallback } from "@citizenfx/http-wrapper";
import type { IncomingMessage, ServerResponse } from "http";
import { config } from "./config";
import { playersService } from "./services/players.service";
import { parseMultipart, readBody } from "./services/multipart.service";
import { uploadService } from "./services/upload.service";
import { buildURL } from "./utils";

function setCors(req: IncomingMessage, res: ServerResponse): void {
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

function checkPlayerIp(req: IncomingMessage): boolean {
  if (!config.security.isPlayerCheck) return true;
  const addr =
    (req as any).connection?.remoteAddress || (req as any).socket?.remoteAddress;
  const ip = addr?.split(":")[0];
  return ip && playersService.isIpConnected(ip);
}

function json(res: ServerResponse, status: number, data: object): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return json(res, 400, { error: "Content-Type must be multipart/form-data" });
  }

  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    return json(res, 400, { error: "Missing boundary" });
  }

  const body = await readBody(req);
  const file = parseMultipart(body, boundary);

  if (!file) {
    return json(res, 400, { error: "No file provided" });
  }

  const validation = uploadService.validateFile(file);
  if (!validation.valid) {
    return json(res, 400, { error: validation.error });
  }

  const filename = await uploadService.save(file);
  const url = buildURL(`uploads/${filename}`);

  json(res, 200, { success: true, filename, url });
}

async function handleGetFile(
  req: IncomingMessage,
  res: ServerResponse,
  filename: string
): Promise<void> {
  const fileBuffer = await uploadService.get(filename);

  if (!fileBuffer) {
    return json(res, 404, { error: "File not found" });
  }

  const mimeType = uploadService.getMimeType(filename);
  res.writeHead(200, {
    "Content-Type": mimeType,
    "Content-Length": fileBuffer.length.toString()
  });
  res.end(fileBuffer);
}

setHttpCallback(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || "/";
  const method = req.method || "GET";

  setCors(req, res);

  // Handle preflight
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Check player IP
  if (!checkPlayerIp(req)) {
    return json(res, 403, { error: "Access denied" });
  }

  try {
    // POST /uploads - Upload a file
    if (method === "POST" && (url === "/uploads" || url === "/uploads/")) {
      await handleUpload(req, res);
      return;
    }

    // GET /uploads/:filename - Serve a file
    const match = url.match(/^\/uploads\/(.+)$/);
    if (method === "GET" && match?.[1]) {
      await handleGetFile(req, res, match[1]);
      return;
    }

    // 404
    json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("Request error:", err);
    json(res, 500, { error: "Internal server error" });
  }
});
