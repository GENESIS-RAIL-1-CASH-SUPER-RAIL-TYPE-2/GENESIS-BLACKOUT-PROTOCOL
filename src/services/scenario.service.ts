// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Scenario Service
// Evolving threat scenario library. 12 categories seeded on cold boot.
// Scenarios evolve (new version, old SUPERSEDED) — preserves drill history.
// "Threats change, so does our defence."
// ============================================================================

import { randomUUID } from "crypto";
import {
  ThreatScenario,
  ScenarioCategory,
  ScenarioSeverity,
  ScenarioLikelihood,
  ScenarioScope,
  ScenarioStatus,
  ScenarioWarGameRef,
  CrownJewelsTier,
} from "../types";

interface SeedEntry {
  category: ScenarioCategory;
  title: string;
  description: string;
  severity: ScenarioSeverity;
  likelihood: ScenarioLikelihood;
  scope: ScenarioScope;
  battleStationsCondition: "BRAVO" | "CHARLIE" | "DELTA";
  affectedTiers: CrownJewelsTier[];
  affectedInfrastructure: string[];
  tags: string[];
}

const SEED_SCENARIOS: SeedEntry[] = [
  {
    category: "POWER_LOSS", title: "EC2 Data Centre Outage",
    description: "AWS eu-west-2 data centre loses power. All containers go dark. No warning.",
    severity: "HIGH", likelihood: "POSSIBLE", scope: "FULL_STACK", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["EC2", "EBS", "Docker"],
    tags: ["infrastructure", "aws", "power"],
  },
  {
    category: "CYBER_ATTACK", title: "Targeted DDoS or State-Actor Intrusion",
    description: "Sophisticated attack targeting Genesis infrastructure. DDoS, credential theft, or persistent backdoor.",
    severity: "CRITICAL", likelihood: "POSSIBLE", scope: "FULL_STACK", battleStationsCondition: "DELTA",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["EC2", "Network", "API Keys"],
    tags: ["cyber", "attack", "state-actor"],
  },
  {
    category: "INFRASTRUCTURE_FAILURE", title: "AWS EU-West-2 Regional Outage",
    description: "Full AWS region failure. All services, EBS volumes, and networking lost.",
    severity: "HIGH", likelihood: "UNLIKELY", scope: "INFRASTRUCTURE", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["EC2", "EBS", "VPC", "Route53"],
    tags: ["infrastructure", "aws", "regional"],
  },
  {
    category: "FINANCIAL_CRISIS", title: "Major Exchange Collapse (FTX-type)",
    description: "A major exchange collapses. Capital trapped. Counterparty risk cascades across all positions.",
    severity: "CRITICAL", likelihood: "POSSIBLE", scope: "GEOGRAPHIC_REGION", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_1"], affectedInfrastructure: ["Exchange APIs", "Capital"],
    tags: ["financial", "exchange", "counterparty"],
  },
  {
    category: "PHYSICAL_BREACH", title: "Device Theft or Office Intrusion",
    description: "Commander's device stolen or office physically breached. API keys, credentials potentially exposed.",
    severity: "HIGH", likelihood: "UNLIKELY", scope: "SINGLE_SERVICE", battleStationsCondition: "BRAVO",
    affectedTiers: ["TIER_0"], affectedInfrastructure: ["Credentials", "Hardware"],
    tags: ["physical", "theft", "credentials"],
  },
  {
    category: "EMP_ATTACK", title: "Electromagnetic Pulse or Solar Flare",
    description: "Large-scale EMP event destroys all electronic equipment in geographic region. Total hardware loss.",
    severity: "EXTINCTION", likelihood: "RARE", scope: "GLOBAL", battleStationsCondition: "DELTA",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["ALL"],
    tags: ["emp", "solar", "hardware-destruction"],
  },
  {
    category: "REGULATORY_SHUTDOWN", title: "UK Government Crypto Ban or Sanctions",
    description: "Government bans crypto trading or sanctions Genesis operations. Must cease all UK-based activity.",
    severity: "CRITICAL", likelihood: "UNLIKELY", scope: "GEOGRAPHIC_REGION", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_1", "TIER_2"], affectedInfrastructure: ["Legal", "Banking", "Exchange Access"],
    tags: ["regulatory", "ban", "sovereign"],
  },
  {
    category: "SUPPLY_CHAIN_COMPROMISE", title: "NPM Package Poisoning or Docker Image Compromise",
    description: "A critical dependency is compromised. Malicious code injected into production containers.",
    severity: "HIGH", likelihood: "POSSIBLE", scope: "FULL_STACK", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["Docker", "NPM", "Dependencies"],
    tags: ["supply-chain", "npm", "docker"],
  },
  {
    category: "INSIDER_THREAT", title: "Credential Leak or Rogue Operator",
    description: "Internal credential leak, rogue AI operator, or compromised API key used to drain capital.",
    severity: "CRITICAL", likelihood: "UNLIKELY", scope: "FULL_STACK", battleStationsCondition: "DELTA",
    affectedTiers: ["TIER_0", "TIER_1"], affectedInfrastructure: ["API Keys", "Credentials", "Capital"],
    tags: ["insider", "credentials", "rogue"],
  },
  {
    category: "SPACE_WEATHER", title: "Severe Solar Storm (Carrington-class)",
    description: "Massive solar storm disrupts global communications, satellites, and power grids for weeks.",
    severity: "EXTINCTION", likelihood: "RARE", scope: "GLOBAL", battleStationsCondition: "DELTA",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["ALL", "Satellites", "Power Grid"],
    tags: ["space", "solar", "global"],
  },
  {
    category: "CASCADING_FAILURE", title: "Multi-Exchange Dark + Network Partition",
    description: "Multiple exchanges go dark simultaneously with network partition isolating services.",
    severity: "CRITICAL", likelihood: "UNLIKELY", scope: "FULL_STACK", battleStationsCondition: "CHARLIE",
    affectedTiers: ["TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["Exchanges", "Network"],
    tags: ["cascading", "multi-failure", "partition"],
  },
  {
    category: "TOTAL_LOSS", title: "Complete Infrastructure Destruction",
    description: "Everything gone. EC2, backups, local copies. Last resort: recover from most distant black site.",
    severity: "EXTINCTION", likelihood: "RARE", scope: "GLOBAL", battleStationsCondition: "DELTA",
    affectedTiers: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], affectedInfrastructure: ["ALL"],
    tags: ["total-loss", "last-resort", "extinction"],
  },
];

export class ScenarioService {
  private scenarios: Map<string, ThreatScenario> = new Map();

  constructor() {
    this.seedScenarios();
  }

  private seedScenarios(): void {
    const now = new Date().toISOString();
    for (const seed of SEED_SCENARIOS) {
      const id = `BKO-SCN-${randomUUID().slice(0, 12)}`;
      const scenario: ThreatScenario = {
        scenarioId: id,
        category: seed.category,
        title: seed.title,
        description: seed.description,
        severity: seed.severity,
        likelihood: seed.likelihood,
        scope: seed.scope,
        status: "ACTIVE",
        affectedTiers: seed.affectedTiers,
        affectedServices: [],
        affectedInfrastructure: seed.affectedInfrastructure,
        failoverPlanId: null,
        recoveryPlaybookId: null,
        battleStationsCondition: seed.battleStationsCondition,
        version: 1,
        parentScenarioId: null,
        warGameResults: [],
        darpaMissionId: null,
        lastDrillAt: null,
        lastDrillScore: null,
        drillCount: 0,
        tags: seed.tags,
        createdAt: now,
        updatedAt: now,
        retiredAt: null,
      };
      this.scenarios.set(id, scenario);
    }
  }

  create(input: {
    category: ScenarioCategory;
    title: string;
    description: string;
    severity: ScenarioSeverity;
    likelihood: ScenarioLikelihood;
    scope: ScenarioScope;
    battleStationsCondition: "BRAVO" | "CHARLIE" | "DELTA";
    affectedTiers?: CrownJewelsTier[];
    affectedServices?: string[];
    affectedInfrastructure?: string[];
    tags?: string[];
  }): ThreatScenario {
    const now = new Date().toISOString();
    const id = `BKO-SCN-${randomUUID().slice(0, 12)}`;
    const scenario: ThreatScenario = {
      scenarioId: id,
      category: input.category,
      title: input.title,
      description: input.description,
      severity: input.severity,
      likelihood: input.likelihood,
      scope: input.scope,
      status: "ACTIVE",
      affectedTiers: input.affectedTiers ?? [],
      affectedServices: input.affectedServices ?? [],
      affectedInfrastructure: input.affectedInfrastructure ?? [],
      failoverPlanId: null,
      recoveryPlaybookId: null,
      battleStationsCondition: input.battleStationsCondition,
      version: 1,
      parentScenarioId: null,
      warGameResults: [],
      darpaMissionId: null,
      lastDrillAt: null,
      lastDrillScore: null,
      drillCount: 0,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
      retiredAt: null,
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  get(id: string): ThreatScenario | undefined {
    return this.scenarios.get(id);
  }

  getAll(filters?: { category?: string; severity?: string; status?: string }): ThreatScenario[] {
    let results = Array.from(this.scenarios.values());
    if (filters?.category) results = results.filter((s) => s.category === filters.category);
    if (filters?.severity) results = results.filter((s) => s.severity === filters.severity);
    if (filters?.status) results = results.filter((s) => s.status === filters.status);
    return results;
  }

  getActive(): ThreatScenario[] {
    return this.getAll({ status: "ACTIVE" });
  }

  update(id: string, partial: Partial<ThreatScenario>): ThreatScenario | undefined {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    Object.assign(scenario, partial, { updatedAt: new Date().toISOString() });
    return scenario;
  }

  evolve(id: string, newTitle?: string, newDescription?: string): ThreatScenario | undefined {
    const old = this.scenarios.get(id);
    if (!old) return undefined;

    // Mark old as SUPERSEDED
    old.status = "SUPERSEDED";
    old.updatedAt = new Date().toISOString();

    // Create evolved version
    const now = new Date().toISOString();
    const newId = `BKO-SCN-${randomUUID().slice(0, 12)}`;
    const evolved: ThreatScenario = {
      ...old,
      scenarioId: newId,
      title: newTitle ?? old.title,
      description: newDescription ?? old.description,
      status: "ACTIVE",
      version: old.version + 1,
      parentScenarioId: id,
      warGameResults: [],
      lastDrillAt: null,
      lastDrillScore: null,
      drillCount: 0,
      createdAt: now,
      updatedAt: now,
      retiredAt: null,
    };
    this.scenarios.set(newId, evolved);
    return evolved;
  }

  recordDrillResult(id: string, result: ScenarioWarGameRef): ThreatScenario | undefined {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    scenario.warGameResults.push(result);
    scenario.lastDrillAt = result.conductedAt;
    scenario.lastDrillScore = result.score;
    scenario.drillCount++;
    scenario.updatedAt = new Date().toISOString();
    if (scenario.warGameResults.length > 50) scenario.warGameResults.shift();
    return scenario;
  }

  getCoverage(): {
    total: number;
    covered: number;
    uncovered: number;
    drilled: number;
    stale: number;
    categories: Record<string, { count: number; covered: boolean; lastDrill: string | null }>;
  } {
    const active = this.getActive();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    let covered = 0;
    let drilled = 0;
    let stale = 0;
    const categories: Record<string, { count: number; covered: boolean; lastDrill: string | null }> = {};

    for (const s of active) {
      const isCovered = s.failoverPlanId !== null && s.recoveryPlaybookId !== null;
      if (isCovered) covered++;

      const isDrilled = s.lastDrillAt && new Date(s.lastDrillAt).getTime() > thirtyDaysAgo;
      if (isDrilled) drilled++;

      const isStale = !s.lastDrillAt || new Date(s.lastDrillAt).getTime() < ninetyDaysAgo;
      if (isStale) stale++;

      if (!categories[s.category]) {
        categories[s.category] = { count: 0, covered: false, lastDrill: null };
      }
      categories[s.category].count++;
      if (isCovered) categories[s.category].covered = true;
      if (s.lastDrillAt) {
        if (!categories[s.category].lastDrill || s.lastDrillAt > categories[s.category].lastDrill!) {
          categories[s.category].lastDrill = s.lastDrillAt;
        }
      }
    }

    return { total: active.length, covered, uncovered: active.length - covered, drilled, stale, categories };
  }

  getUncovered(): ThreatScenario[] {
    return this.getActive().filter((s) => !s.failoverPlanId || !s.recoveryPlaybookId);
  }

  getStale(maxAgeDays = 90): ThreatScenario[] {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    return this.getActive().filter((s) => !s.lastDrillAt || new Date(s.lastDrillAt).getTime() < cutoff);
  }

  getCount(): number {
    return this.scenarios.size;
  }

  getByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const s of this.scenarios.values()) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }

  getByStatus(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const s of this.scenarios.values()) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }
}
