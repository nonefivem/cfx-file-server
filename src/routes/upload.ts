import { Hono } from "hono/tiny";
import { BASE_URL, RESOURCE_NAME } from "../constants";
import { uploadService } from "../services/upload.service";

const UPLOADS_BASE_URL = BASE_URL + `/${RESOURCE_NAME}/uploads`;
export const uploadRoutes = new Hono();

// Upload a file
uploadRoutes.post("/", async (c) => {
  const body = await c.req.formData();
  const file = body.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const validation = uploadService.validateFile(file);
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }

  const filename = await uploadService.save(file);
  const url = `${UPLOADS_BASE_URL}/${filename}`;

  return c.json({ success: true, filename, url }, 200);
});

// Get/serve a file
uploadRoutes.get("/:filename", async (c) => {
  const filename = c.req.param("filename");
  const fileBuffer = await uploadService.get(filename);

  if (!fileBuffer) {
    return c.json({ error: "File not found" }, 404);
  }

  const mimeType = uploadService.getMimeType(filename);
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
});
