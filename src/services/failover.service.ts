// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Failover Service
// What happens when each scenario occurs. 14 action types.
// Drills are simulated by default. Real actions need Commander approval.
// "Many fallbacks. Think NORAD, Pentagon, Iron Mountain."
// ============================================================================

import { randomUUID } from "crypto";
import {
  FailoverPlan,
  FailoverAction,
  FailoverExecution,
  FailoverActionResult,
  FailoverActionType,
} from "../types";

// Seed failover plans
interface SeedPlan {
  title: string;
  description: string;
  actions: Array<{
    type: FailoverActionType;
    target: string;
    priority: number;
    timeoutMs: number;
    mandatory: boolean;
    description: string;
  }>;
  estimatedRecoveryTimeMs: number;
  autoExecute: boolean;
  commanderApprovalRequired: boolean;
}

const SEED_PLANS: SeedPlan[] = [
  {
    title: "FAILOVER DELTA — Full Emergency Response",
    description: "Maximum severity response. Kill switch, treasury sweep, black site activation, full notification chain.",
    actions: [
      { type: "KILL_SWITCH_ACTIVATE", target: "kill-switch-v2:7100", priority: 1, timeoutMs: 5000, mandatory: true, description: "Activate kill switch — halt all trading" },
      { type: "TREASURY_SWEEP", target: "treasury-sentinel:8660", priority: 2, timeoutMs: 10000, mandatory: true, description: "Emergency sweep all exchange balances to cold wallet" },
      { type: "EVIDENCE_PRESERVATION", target: "ledger-lite:8500", priority: 3, timeoutMs: 5000, mandatory: true, description: "Snapshot and seal all ledger evidence" },
      { type: "SEAL_API_KEYS", target: "manual", priority: 4, timeoutMs: 0, mandatory: true, description: "Revoke all exchange API keys" },
      { type: "BATTLE_STATIONS_ESCALATE", target: "battle-stations:8810", priority: 5, timeoutMs: 5000, mandatory: false, description: "Escalate to DELTA condition" },
      { type: "GHOST_FLEET_ACTIVATE", target: "ghost-fleet:8811", priority: 6, timeoutMs: 5000, mandatory: false, description: "Activate ghost fleet tar-pit mode" },
      { type: "ACTIVATE_BLACK_SITE", target: "all-active", priority: 7, timeoutMs: 30000, mandatory: false, description: "Verify all black sites reachable" },
      { type: "NOTIFY_COMMANDER", target: "signal+email", priority: 8, timeoutMs: 15000, mandatory: true, description: "Alert Commander via Signal + Email" },
      { type: "NOTIFY_CEO", target: "signal+email", priority: 9, timeoutMs: 15000, mandatory: false, description: "Alert CEO (Xmas) via Signal + Email" },
    ],
    estimatedRecoveryTimeMs: 3600000, // 1 hour
    autoExecute: false,
    commanderApprovalRequired: true,
  },
  {
    title: "FAILOVER INFRASTRUCTURE — Cloud Failure Response",
    description: "AWS region failure. Activate warm standby, DNS failover, preserve evidence.",
    actions: [
      { type: "EVIDENCE_PRESERVATION", target: "ledger-lite:8500", priority: 1, timeoutMs: 5000, mandatory: true, description: "Snapshot ledger before potential loss" },
      { type: "DNS_FAILOVER", target: "route53", priority: 2, timeoutMs: 10000, mandatory: false, description: "Switch DNS to backup region (when available)" },
      { type: "ACTIVATE_WARM_STANDBY", target: "hetzner-vps", priority: 3, timeoutMs: 30000, mandatory: false, description: "Bring up warm standby (Phase 2+)" },
      { type: "ACTIVATE_BLACK_SITE", target: "geographic-vps", priority: 4, timeoutMs: 30000, mandatory: false, description: "Activate geographic VPS black sites" },
      { type: "NOTIFY_COMMANDER", target: "signal+email", priority: 5, timeoutMs: 15000, mandatory: true, description: "Alert Commander of infrastructure failure" },
    ],
    estimatedRecoveryTimeMs: 7200000, // 2 hours
    autoExecute: false,
    commanderApprovalRequired: true,
  },
  {
    title: "FAILOVER TOTAL LOSS — Nuclear Option",
    description: "Everything gone. Cold boot from most distant black site. Last resort recovery.",
    actions: [
      { type: "DEAD_DROP_BROADCAST", target: "all-sites", priority: 1, timeoutMs: 60000, mandatory: false, description: "Broadcast dead drop signal to all black sites" },
      { type: "COLD_BOOT_FROM_BACKUP", target: "furthest-black-site", priority: 2, timeoutMs: 300000, mandatory: true, description: "Provision new infrastructure from encrypted backup" },
      { type: "ROTATE_ENCRYPTION_KEYS", target: "all", priority: 3, timeoutMs: 30000, mandatory: true, description: "Rotate all encryption keys (assume compromised)" },
      { type: "SEAL_API_KEYS", target: "all-exchanges", priority: 4, timeoutMs: 0, mandatory: true, description: "Revoke ALL API keys, generate new ones" },
      { type: "NOTIFY_COMMANDER", target: "dead-drop", priority: 5, timeoutMs: 0, mandatory: true, description: "Commander notified via dead drop protocol" },
      { type: "NOTIFY_CEO", target: "dead-drop", priority: 6, timeoutMs: 0, mandatory: true, description: "CEO notified via dead drop protocol" },
    ],
    estimatedRecoveryTimeMs: 86400000, // 24 hours
    autoExecute: false,
    commanderApprovalRequired: true,
  },
];

export class FailoverService {
  private plans: Map<string, FailoverPlan> = new Map();
  private executions: FailoverExecution[] = [];
  private readonly maxExecutions = 100;

  constructor() {
    this.seedPlans();
  }

  private seedPlans(): void {
    const now = new Date().toISOString();
    for (const seed of SEED_PLANS) {
      const id = `BKO-FO-${randomUUID().slice(0, 12)}`;
      const plan: FailoverPlan = {
        planId: id,
        scenarioIds: [],
        title: seed.title,
        description: seed.description,
        actions: seed.actions.map((a) => ({
          actionId: `${id}-ACT-${a.priority}`,
          ...a,
        })),
        estimatedRecoveryTimeMs: seed.estimatedRecoveryTimeMs,
        lastTestedAt: null,
        lastTestScore: null,
        autoExecute: seed.autoExecute,
        commanderApprovalRequired: seed.commanderApprovalRequired,
        createdAt: now,
        updatedAt: now,
      };
      this.plans.set(id, plan);
    }
  }

  createPlan(input: {
    title: string;
    description: string;
    scenarioIds?: string[];
    actions: Array<{
      type: FailoverActionType;
      target: string;
      priority: number;
      timeoutMs: number;
      mandatory: boolean;
      description: string;
    }>;
    estimatedRecoveryTimeMs: number;
    autoExecute?: boolean;
    commanderApprovalRequired?: boolean;
  }): FailoverPlan {
    const now = new Date().toISOString();
    const id = `BKO-FO-${randomUUID().slice(0, 12)}`;
    const plan: FailoverPlan = {
      planId: id,
      scenarioIds: input.scenarioIds ?? [],
      title: input.title,
      description: input.description,
      actions: input.actions.map((a, i) => ({
        actionId: `${id}-ACT-${i + 1}`,
        ...a,
      })),
      estimatedRecoveryTimeMs: input.estimatedRecoveryTimeMs,
      lastTestedAt: null,
      lastTestScore: null,
      autoExecute: input.autoExecute ?? false,
      commanderApprovalRequired: input.commanderApprovalRequired ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.plans.set(id, plan);
    return plan;
  }

  get(id: string): FailoverPlan | undefined {
    return this.plans.get(id);
  }

  getAll(): FailoverPlan[] {
    return Array.from(this.plans.values());
  }

  execute(planId: string, isDrill: boolean, scenarioId?: string, commanderApproved = false): FailoverExecution | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const now = new Date().toISOString();
    const executionId = `BKO-EXEC-${randomUUID().slice(0, 12)}`;

    // Execute actions in priority order (simulated for drills)
    const sortedActions = [...plan.actions].sort((a, b) => a.priority - b.priority);
    const results: FailoverActionResult[] = sortedActions.map((action) => ({
      actionId: action.actionId,
      type: action.type,
      success: isDrill ? true : false, // Real execution would call actual services
      durationMs: isDrill ? Math.floor(Math.random() * 1000) + 100 : 0,
      error: isDrill ? null : "Real execution not implemented — Commander manual override required",
      timestamp: new Date().toISOString(),
    }));

    const execution: FailoverExecution = {
      executionId,
      planId,
      scenarioId: scenarioId ?? null,
      isDrill,
      actions: results,
      overallSuccess: results.every((r) => r.success),
      startedAt: now,
      completedAt: new Date().toISOString(),
      commanderApproved,
    };

    // Update plan
    plan.lastTestedAt = now;
    plan.lastTestScore = execution.overallSuccess ? 100 : results.filter((r) => r.success).length / results.length * 100;
    plan.updatedAt = now;

    this.executions.push(execution);
    if (this.executions.length > this.maxExecutions) this.executions.shift();

    return execution;
  }

  getExecutionHistory(limit = 20): FailoverExecution[] {
    return this.executions.slice(-limit);
  }

  getCount(): number {
    return this.plans.size;
  }

  getTestedCount(maxAgeDays = 30): number {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    return this.getAll().filter((p) => p.lastTestedAt && new Date(p.lastTestedAt).getTime() > cutoff).length;
  }
}
