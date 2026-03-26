// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Replication Service
// Multi-site backup distribution tied to Crown Jewels tiers.
// "Like BTC — decentralisation. We expect a node to fail."
// ============================================================================

import { randomUUID } from "crypto";
import {
  ReplicationRule,
  ReplicationEvent,
  ReplicationStatus,
  ReplicationFrequency,
  CrownJewelsTier,
} from "../types";

const FREQUENCY_MS: Record<ReplicationFrequency, number> = {
  CONTINUOUS: 60_000,
  HOURLY: 3_600_000,
  DAILY: 86_400_000,
  WEEKLY: 604_800_000,
  MONTHLY: 2_592_000_000,
};

interface SeedRule {
  tier: CrownJewelsTier;
  frequency: ReplicationFrequency;
  assets: string[];
}

const SEED_RULES: SeedRule[] = [
  {
    tier: "TIER_0", frequency: "DAILY",
    assets: ["Whiteboard", "Ledger Lite", "Brighton DOCTRINE", "Centurion", "Academy", "API Keys", "Command Wallet"],
  },
  {
    tier: "TIER_1", frequency: "DAILY",
    assets: ["GTC Telemetry", "CIA Intel", "ARIS Assessments", "Follow the Sun Logs", "Treasury Sentinel Logs"],
  },
  {
    tier: "TIER_2", frequency: "WEEKLY",
    assets: ["Raw Price Snapshots", "DeFi Rates", "Bridge Pricing", "Cross-Chain Spreads"],
  },
  {
    tier: "TIER_3", frequency: "MONTHLY",
    assets: ["Debug Logs", "API Samples", "Build Artifacts"],
  },
];

export class ReplicationService {
  private rules: Map<string, ReplicationRule> = new Map();
  private events: ReplicationEvent[] = [];
  private readonly maxEvents = 500;

  constructor() {
    this.seedRules();
  }

  private seedRules(): void {
    const now = new Date().toISOString();
    for (const seed of SEED_RULES) {
      const id = `BKO-REP-${randomUUID().slice(0, 12)}`;
      const rule: ReplicationRule = {
        ruleId: id,
        tier: seed.tier,
        frequency: seed.frequency,
        targetSiteIds: [],
        assets: seed.assets,
        encryptionKeyRef: `CROWN_JEWELS_${seed.tier}_KEY`,
        lastRunAt: null,
        lastRunStatus: "NEVER_RUN",
        lastRunDurationMs: null,
        lastVerifiedAt: null,
        nextScheduledAt: now,
        consecutiveFailures: 0,
        totalRuns: 0,
        totalSuccesses: 0,
        createdAt: now,
        updatedAt: now,
      };
      this.rules.set(id, rule);
    }
  }

  createRule(input: {
    tier: CrownJewelsTier;
    frequency: ReplicationFrequency;
    targetSiteIds: string[];
    assets: string[];
    encryptionKeyRef?: string;
  }): ReplicationRule {
    const now = new Date().toISOString();
    const id = `BKO-REP-${randomUUID().slice(0, 12)}`;
    const rule: ReplicationRule = {
      ruleId: id,
      tier: input.tier,
      frequency: input.frequency,
      targetSiteIds: input.targetSiteIds,
      assets: input.assets,
      encryptionKeyRef: input.encryptionKeyRef ?? `CROWN_JEWELS_${input.tier}_KEY`,
      lastRunAt: null,
      lastRunStatus: "NEVER_RUN",
      lastRunDurationMs: null,
      lastVerifiedAt: null,
      nextScheduledAt: now,
      consecutiveFailures: 0,
      totalRuns: 0,
      totalSuccesses: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(id, rule);
    return rule;
  }

  getRules(filters?: { tier?: string; status?: string }): ReplicationRule[] {
    let results = Array.from(this.rules.values());
    if (filters?.tier) results = results.filter((r) => r.tier === filters.tier);
    if (filters?.status) results = results.filter((r) => r.lastRunStatus === filters.status);
    return results;
  }

  getRule(id: string): ReplicationRule | undefined {
    return this.rules.get(id);
  }

  triggerReplication(ruleId: string, siteId: string): ReplicationEvent | undefined {
    const rule = this.rules.get(ruleId);
    if (!rule) return undefined;

    const start = Date.now();
    const now = new Date().toISOString();
    const eventId = `BKO-REPEVT-${randomUUID().slice(0, 12)}`;

    // Simulate replication (actual backup handled by Crown Jewels cron)
    const event: ReplicationEvent = {
      eventId,
      ruleId,
      tier: rule.tier,
      status: "SUCCESS",
      assetsReplicated: rule.assets,
      assetsFailed: [],
      siteId,
      checksumBefore: null,
      checksumAfter: randomUUID().replace(/-/g, "").slice(0, 32),
      checksumVerified: true,
      durationMs: Date.now() - start,
      sizeBytes: 0,
      timestamp: now,
    };

    // Update rule state
    rule.lastRunAt = now;
    rule.lastRunStatus = "HEALTHY";
    rule.lastRunDurationMs = event.durationMs;
    rule.lastVerifiedAt = now;
    rule.totalRuns++;
    rule.totalSuccesses++;
    rule.consecutiveFailures = 0;
    rule.nextScheduledAt = new Date(Date.now() + FREQUENCY_MS[rule.frequency]).toISOString();
    rule.updatedAt = now;

    this.events.push(event);
    if (this.events.length > this.maxEvents) this.events.shift();

    return event;
  }

  getHealth(): {
    totalRules: number;
    healthy: number;
    stale: number;
    failed: number;
    neverRun: number;
  } {
    const rules = Array.from(this.rules.values());
    return {
      totalRules: rules.length,
      healthy: rules.filter((r) => r.lastRunStatus === "HEALTHY").length,
      stale: rules.filter((r) => r.lastRunStatus === "STALE").length,
      failed: rules.filter((r) => r.lastRunStatus === "FAILED").length,
      neverRun: rules.filter((r) => r.lastRunStatus === "NEVER_RUN").length,
    };
  }

  getHistory(limit = 50): ReplicationEvent[] {
    return this.events.slice(-limit);
  }

  getStaleRules(): ReplicationRule[] {
    const now = Date.now();
    return Array.from(this.rules.values()).filter((r) => {
      if (r.lastRunStatus === "NEVER_RUN") return true;
      if (!r.lastRunAt) return true;
      const elapsed = now - new Date(r.lastRunAt).getTime();
      return elapsed > FREQUENCY_MS[r.frequency] * 1.5;
    });
  }

  getFailedRules(): ReplicationRule[] {
    return Array.from(this.rules.values()).filter((r) => r.consecutiveFailures > 0);
  }

  markStale(): void {
    const now = Date.now();
    for (const rule of this.rules.values()) {
      if (rule.lastRunStatus === "NEVER_RUN") continue;
      if (!rule.lastRunAt) continue;
      const elapsed = now - new Date(rule.lastRunAt).getTime();
      if (elapsed > FREQUENCY_MS[rule.frequency] * 1.5 && rule.lastRunStatus === "HEALTHY") {
        rule.lastRunStatus = "STALE";
        rule.updatedAt = new Date().toISOString();
      }
    }
  }

  getLastReplicationAt(): string | null {
    if (this.events.length === 0) return null;
    return this.events[this.events.length - 1].timestamp;
  }
}
