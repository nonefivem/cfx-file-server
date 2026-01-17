import { config } from "../config";
import { cacheService } from "./cache.service";

class PlayersService {
  constructor(private readonly cache = cacheService) {}

  isIpConnected(ip: string): boolean {
    const cached = this.cache.get<boolean>(`player-ip-${ip}`);

    if (!!cached) {
      return cached;
    }

    let found = false;
    for (let i = 0; i < GetNumPlayerIndices(); i++) {
      const source = GetPlayerFromIndex(i);
      const playerIp = GetPlayerEndpoint(source);

      if (ip === playerIp) {
        found = true;
        break;
      }
    }

    this.cache.set<boolean>(`player-ip-${ip}`, found, config.cache.ttl);
    return found;
  }
}

export type { PlayersService };
export const playersService = new PlayersService();
