import type { IncomingMessage } from "http";

export function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function parseMultipart(body: Buffer, boundary: string): File | null {
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

    return new File([part.subarray(headerEnd + 4, contentEnd)], filenameMatch[1], {
      type: mimeType
    });
  }

  return null;
}
