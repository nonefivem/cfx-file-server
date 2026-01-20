import type { IncomingMessage } from "http";

export interface ParsedFile {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

export function readBody(req: IncomingMessage, maxSize: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on("data", (chunk: Buffer) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalSize += buf.length;

      // Early rejection if size exceeds limit (avoid wasting memory)
      if (totalSize > maxSize) {
        req.destroy();
        reject(new Error("FILE_TOO_LARGE"));
        return;
      }

      chunks.push(buf);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function parseMultipart(body: Buffer, boundary: string): ParsedFile | null {
  const marker = Buffer.from(`--${boundary}`);
  const positions: number[] = [];
  let pos = 0;

  while ((pos = body.indexOf(marker, pos)) !== -1) {
    positions.push(pos);
    pos += marker.length;
  }

  if (positions.length < 2) return null;

  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i]! + marker.length;
    const end = positions[i + 1]!;
    const part = body.subarray(start, end);

    let offset = part[0] === 0x0d && part[1] === 0x0a ? 2 : 0;
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"), offset);
    if (headerEnd === -1) continue;

    const headers = part.subarray(offset, headerEnd).toString("utf-8");
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (!filenameMatch?.[1]) continue;

    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    const mimeType = contentTypeMatch?.[1]?.trim() ?? "application/octet-stream";

    let contentEnd = part.length;
    if (part[contentEnd - 2] === 0x0d && part[contentEnd - 1] === 0x0a) contentEnd -= 2;

    const buffer = part.subarray(headerEnd + 4, contentEnd);
    return {
      filename: filenameMatch[1],
      mimeType,
      buffer,
      size: buffer.length
    };
  }

  return null;
}
