//@ts-ignore - No declarations available
import { setHttpCallback } from "@citizenfx/http-wrapper";
import { Hono } from "hono/tiny";
import { getRequestListener } from "@hono/node-server";
import { config } from "./config";
import { uploadRoutes } from "./routes/upload";

export const app = new Hono();

// Mount routes
app.route("/uploads", uploadRoutes);

setHttpCallback(
  getRequestListener(app.fetch.bind(app), {
    hostname: config.server.hostname,
    overrideGlobalObjects: false,
    autoCleanupIncoming: true,
  }),
);
