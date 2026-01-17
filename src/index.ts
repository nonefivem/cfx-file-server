//@ts-ignore - No declarations available
import { setHttpCallback } from "@citizenfx/http-wrapper";
import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono/tiny";
import { config } from "./config";
import { isPlayerMw } from "./middlewares";
import { uploadRoutes } from "./routes/upload";

export const app = new Hono().use(isPlayerMw);

// Mount routes
app.route("/uploads", uploadRoutes);

setHttpCallback(
  getRequestListener(app.fetch.bind(app), {
    hostname: config.server.hostname,
    overrideGlobalObjects: false,
    autoCleanupIncoming: true,
  }),
);
