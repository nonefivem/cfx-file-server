import { getConnInfo } from "@hono/node-server/conninfo";
import { createMiddleware } from "hono/factory";
import { playersService } from "../services/players.service";

export const isPlayerMw = createMiddleware(async (c, next) => {
  const ip = getConnInfo(c).remote.address;

  if (!ip) {
    return c.json({ error: "Unable to determine IP address" }, 400);
  }

  const isConnected = playersService.isIpConnected(ip);

  if (!isConnected) {
    return c.json({ error: "Access denied" }, 403);
  }

  return next();
});
