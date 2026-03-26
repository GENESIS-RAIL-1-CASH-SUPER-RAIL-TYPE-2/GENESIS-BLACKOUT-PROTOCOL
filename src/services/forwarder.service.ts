// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Forwarder Service
// Fire-and-forget downstream writes. Standard Genesis pattern.
// ============================================================================

const GTC_URL = process.env.GTC_URL ?? "http://genesis-beachhead-gtc:8650";
const WHITEBOARD_URL = process.env.WHITEBOARD_URL ?? "http://genesis-whiteboard:8710";
const LEDGER_LITE_URL = process.env.LEDGER_LITE_URL ?? "http://genesis-ledger-lite:8500";
const CIA_URL = process.env.CIA_URL ?? "http://genesis-cia:8797";
const DARPA_URL = process.env.DARPA_URL ?? "http://genesis-darpa:8840";
const BATTLE_STATIONS_URL = process.env.BATTLE_STATIONS_URL ?? "http://genesis-battle-stations:8810";
const ARIS_URL = process.env.ARIS_URL ?? "http://genesis-aris:8798";

interface ForwardStats {
  gtcSent: number;
  gtcFailed: number;
  whiteboardSent: number;
  whiteboardFailed: number;
  ledgerSent: number;
  ledgerFailed: number;
  ciaSent: number;
  ciaFailed: number;
  darpaSent: number;
  darpaFailed: number;
  battleStationsSent: number;
  battleStationsFailed: number;
  arisSent: number;
  arisFailed: number;
}

async function fireAndForget(url: string, body: unknown): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export class ForwarderService {
  private stats: ForwardStats = {
    gtcSent: 0, gtcFailed: 0,
    whiteboardSent: 0, whiteboardFailed: 0,
    ledgerSent: 0, ledgerFailed: 0,
    ciaSent: 0, ciaFailed: 0,
    darpaSent: 0, darpaFailed: 0,
    battleStationsSent: 0, battleStationsFailed: 0,
    arisSent: 0, arisFailed: 0,
  };

  async forwardToGtc(event: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${GTC_URL}/ingest`, {
      source: "BLACKOUT_PROTOCOL",
      event,
      data,
    });
    ok ? this.stats.gtcSent++ : this.stats.gtcFailed++;
  }

  async forwardToWhiteboard(category: string, intelligence: unknown, tags: string[]): Promise<void> {
    const ok = await fireAndForget(`${WHITEBOARD_URL}/intel/ingest`, {
      source: "BLACKOUT_PROTOCOL",
      type: category,
      payload: intelligence,
      confidence: 1.0,
      tags: ["blackout", ...tags],
    });
    ok ? this.stats.whiteboardSent++ : this.stats.whiteboardFailed++;
  }

  async forwardToLedgerLite(event: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${LEDGER_LITE_URL}/payload`, {
      rail: "BLACKOUT_PROTOCOL",
      type: event,
      data,
      timestamp: new Date().toISOString(),
    });
    ok ? this.stats.ledgerSent++ : this.stats.ledgerFailed++;
  }

  async forwardToCia(type: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${CIA_URL}/warning`, {
      source: "BLACKOUT_PROTOCOL",
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    ok ? this.stats.ciaSent++ : this.stats.ciaFailed++;
  }

  async forwardToDarpa(type: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${DARPA_URL}/problem/create`, {
      source: "BLACKOUT_PROTOCOL",
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    ok ? this.stats.darpaSent++ : this.stats.darpaFailed++;
  }

  async forwardToBattleStations(type: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${BATTLE_STATIONS_URL}/trigger`, {
      type,
      source: "BLACKOUT_PROTOCOL",
      ...data as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });
    ok ? this.stats.battleStationsSent++ : this.stats.battleStationsFailed++;
  }

  async forwardToAris(type: string, data: unknown): Promise<void> {
    const ok = await fireAndForget(`${ARIS_URL}/intel/receive`, {
      source: "BLACKOUT_PROTOCOL",
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    ok ? this.stats.arisSent++ : this.stats.arisFailed++;
  }

  async registerDarpaMission(mission: unknown): Promise<boolean> {
    return fireAndForget(`${DARPA_URL}/mission/create`, mission);
  }

  async reportDarpaFinding(missionId: string, finding: unknown): Promise<boolean> {
    return fireAndForget(`${DARPA_URL}/mission/${missionId}/debrief`, {
      source: "BLACKOUT_PROTOCOL",
      finding,
      timestamp: new Date().toISOString(),
    });
  }

  async requestArisVerification(siteId: string, data: unknown): Promise<boolean> {
    return fireAndForget(`${ARIS_URL}/intel/assess-manual`, {
      source: "BLACKOUT_PROTOCOL",
      type: "BLACK_SITE_VERIFICATION",
      siteId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  getStats(): ForwardStats {
    return { ...this.stats };
  }
}
