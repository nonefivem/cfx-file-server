//@ts-ignore - No declarations available
import { setHttpCallback } from "@citizenfx/http-wrapper";
import type { IncomingMessage, ServerResponse } from "http";
import { config } from "./config";
import { playersService } from "./services/players.service";
import { rateLimitService } from "./services/ratelimit.service";
import { uploadService } from "./services/upload.service";
import { setCors, getClientIp, json, parseMultipart, readBody, buildURL } from "./utils";

function checkPlayerIp(req: IncomingMessage): boolean {
  if (!config.security.isPlayerCheck) return true;
  const ip = getClientIp(req);
  return ip ? playersService.isIpConnected(ip) : false;
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

  let body: Buffer;
  try {
    // Early rejection if body exceeds max size (with some overhead for multipart headers)
    body = await readBody(req, uploadService.maxFileSizeBytes + 10240);
  } catch (err: any) {
    if (err?.message === "FILE_TOO_LARGE") {
      return json(res, 413, { error: "File too large" });
    }
    throw err;
  }

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
  // Use streaming - file is piped directly without loading into memory
  const success = await uploadService.stream(filename, res);

  if (!success) {
    return json(res, 404, { error: "File not found" });
  }
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
      // Rate limit uploads only
      const clientIp = getClientIp(req);
      if (clientIp && !rateLimitService.isAllowed(clientIp)) {
        res.setHeader("Retry-After", rateLimitService.getResetTime(clientIp).toString());
        return json(res, 429, { error: "Too many requests" });
      }
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
