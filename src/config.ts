import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RESOURCE_NAME } from "./constants";

export interface Config {
  security: {
    trustedOrigins: string[];
    isPlayerCheck: boolean;
  };
  server: {
    hostname: string;
  };
  cache: {
    ttl: number;
  };
  uploads: {
    directory: string;
    maxFileSizeMB: number;
    allowedMimeTypes: string[];
  };
}

function loadConfig(): Config {
  try {
    const configPath = join(GetResourcePath(RESOURCE_NAME), "config.json");
    const configData = readFileSync(configPath, "utf-8");
    return JSON.parse(configData) as Config;
  } catch (error) {
    console.warn(
      "Could not load config.json, using default configuration.",
      (error as Error).message
    );
    // Return defaults if config file doesn't exist
    return {
      security: {
        trustedOrigins: ["*"],
        isPlayerCheck: true
      },
      server: {
        hostname: "localhost"
      },
      cache: {
        ttl: 30000
      },
      uploads: {
        directory: "./uploads",
        maxFileSizeMB: 10,
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
          "application/pdf",
          "video/mp4",
          "video/webm",
          "video/ogg",
          "audio/mpeg",
          "audio/ogg",
          "audio/wav",
          "audio/webm"
        ]
      }
    };
  }
}

export const config = loadConfig();
