// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Readiness Service
// Blackout Readiness Index (BRI) — 6 weighted dimensions, 0-100.
// FORTRESS (90-100) | PREPARED (70-89) | DEVELOPING (50-69) |
// VULNERABLE (30-49) | EXPOSED (0-29)
// "The question is not IF, but WHEN. How ready are we?"
// ============================================================================

import {
  BlackoutReadinessScore,
  BriCategory,
  ReadinessDimension,
} from "../types";
import { ScenarioService } from "./scenario.service";
import { ReplicationService } from "./replication.service";
import { BlackSiteService } from "./blacksite.service";
import { FailoverService } from "./failover.service";
import { PlaybookService } from "./playbook.service";

// BRI dimension weights
const WEIGHTS = {
  SCENARIO_COVERAGE: 0.25,
  REPLICATION_HEALTH: 0.25,
  BLACK_SITE_DISTRIBUTION: 0.15,
  FAILOVER_PLAN_TESTING: 0.15,
  RECOVERY_PLAYBOOK_REHEARSAL: 0.10,
  DRILL_FRESHNESS: 0.10,
} as const;

function categorise(score: number): BriCategory {
  if (score >= 90) return "FORTRESS";
  if (score >= 70) return "PREPARED";
  if (score >= 50) return "DEVELOPING";
  if (score >= 30) return "VULNERABLE";
  return "EXPOSED";
}

export class ReadinessService {
  private lastScore: BlackoutReadinessScore | null = null;
  private history: BlackoutReadinessScore[] = [];
  private readonly maxHistory = 100;

  constructor(
    private readonly scenarios: ScenarioService,
    private readonly replication: ReplicationService,
    private readonly blackSites: BlackSiteService,
    private readonly failover: FailoverService,
    private readonly playbooks: PlaybookService,
  ) {}

  compute(): BlackoutReadinessScore {
    const dimensions: ReadinessDimension[] = [];
    const recommendations: string[] = [];

    // --- 1. Scenario Coverage (25%) ---
    const coverage = this.scenarios.getCoverage();
    const coveragePct = coverage.total > 0 ? (coverage.covered / coverage.total) * 100 : 0;
    const coverageEvidence: string[] = [];
    const coverageGaps: string[] = [];
    coverageEvidence.push(`${coverage.covered}/${coverage.total} scenarios have failover + playbook`);
    if (coverage.uncovered > 0) {
      coverageGaps.push(`${coverage.uncovered} scenarios lack failover or playbook`);
      recommendations.push(`Cover ${coverage.uncovered} unprotected scenario(s) with failover plans and recovery playbooks`);
    }
    dimensions.push({
      dimension: "Scenario Coverage",
      score: Math.round(coveragePct),
      weight: WEIGHTS.SCENARIO_COVERAGE,
      evidence: coverageEvidence,
      gaps: coverageGaps,
    });

    // --- 2. Replication Health (25%) ---
    const repHealth = this.replication.getHealth();
    const repPct = repHealth.totalRules > 0
      ? (repHealth.healthy / repHealth.totalRules) * 100
      : 0;
    const repEvidence: string[] = [];
    const repGaps: string[] = [];
    repEvidence.push(`${repHealth.healthy}/${repHealth.totalRules} rules HEALTHY`);
    if (repHealth.stale > 0) {
      repGaps.push(`${repHealth.stale} replication rule(s) STALE`);
      recommendations.push(`Trigger replication for ${repHealth.stale} stale rule(s)`);
    }
    if (repHealth.failed > 0) {
      repGaps.push(`${repHealth.failed} replication rule(s) FAILED`);
      recommendations.push(`Investigate ${repHealth.failed} failed replication rule(s) — TIER_0 data may be at risk`);
    }
    if (repHealth.neverRun > 0) {
      repGaps.push(`${repHealth.neverRun} replication rule(s) NEVER_RUN`);
      recommendations.push(`Run initial replication for ${repHealth.neverRun} untested rule(s)`);
    }
    dimensions.push({
      dimension: "Replication Health",
      score: Math.round(repPct),
      weight: WEIGHTS.REPLICATION_HEALTH,
      evidence: repEvidence,
      gaps: repGaps,
    });

    // --- 3. Black Site Distribution (15%) ---
    const activeSites = this.blackSites.getActiveCount();
    const totalSites = this.blackSites.getCount();
    const distribution = this.blackSites.getGeographicDistribution();
    const zoneCount = Object.keys(distribution).length;
    // Score: active sites presence (50%) + geographic diversity (50%)
    // 3+ active sites = full marks on presence, 3+ zones = full marks on diversity
    const presenceScore = Math.min(activeSites / 3, 1) * 50;
    const diversityScore = Math.min(zoneCount / 3, 1) * 50;
    const sitePct = presenceScore + diversityScore;
    const siteEvidence: string[] = [];
    const siteGaps: string[] = [];
    siteEvidence.push(`${activeSites} active site(s) across ${zoneCount} zone(s)`);
    if (activeSites === 0) {
      siteGaps.push("No active black sites registered");
      recommendations.push("CRITICAL: Register at least 1 black site for TIER_0 backup");
    } else if (activeSites < 3) {
      siteGaps.push(`Only ${activeSites} active site(s) — minimum 3 recommended`);
      recommendations.push(`Register ${3 - activeSites} more black site(s) for redundancy`);
    }
    if (zoneCount < 2) {
      siteGaps.push("Insufficient geographic diversity — need sites in multiple zones");
      recommendations.push("Add black sites in different geographic zones (EMEA, APAC, AMERICAS)");
    }
    const unverified = this.blackSites.getUnverified();
    if (unverified.length > 0) {
      siteGaps.push(`${unverified.length} site(s) unverified in last 30 days`);
      recommendations.push(`Verify ${unverified.length} unverified black site(s) via ARIS`);
    }
    dimensions.push({
      dimension: "Black Site Distribution",
      score: Math.round(sitePct),
      weight: WEIGHTS.BLACK_SITE_DISTRIBUTION,
      evidence: siteEvidence,
      gaps: siteGaps,
    });

    // --- 4. Failover Plan Testing (15%) ---
    const totalPlans = this.failover.getCount();
    const testedPlans = this.failover.getTestedCount(30);
    const testPct = totalPlans > 0 ? (testedPlans / totalPlans) * 100 : 0;
    const testEvidence: string[] = [];
    const testGaps: string[] = [];
    testEvidence.push(`${testedPlans}/${totalPlans} plans tested in last 30 days`);
    if (testedPlans < totalPlans) {
      const untested = totalPlans - testedPlans;
      testGaps.push(`${untested} plan(s) not tested in last 30 days`);
      recommendations.push(`Run drill on ${untested} untested failover plan(s)`);
    }
    dimensions.push({
      dimension: "Failover Plan Testing",
      score: Math.round(testPct),
      weight: WEIGHTS.FAILOVER_PLAN_TESTING,
      evidence: testEvidence,
      gaps: testGaps,
    });

    // --- 5. Recovery Playbook Rehearsal (10%) ---
    const totalPlaybooks = this.playbooks.getCount();
    const rehearsedPlaybooks = this.playbooks.getRehearsedCount(30);
    const rehearsalPct = totalPlaybooks > 0 ? (rehearsedPlaybooks / totalPlaybooks) * 100 : 0;
    const rehearsalEvidence: string[] = [];
    const rehearsalGaps: string[] = [];
    rehearsalEvidence.push(`${rehearsedPlaybooks}/${totalPlaybooks} playbooks rehearsed in last 30 days`);
    if (rehearsedPlaybooks < totalPlaybooks) {
      const unrehearsed = totalPlaybooks - rehearsedPlaybooks;
      rehearsalGaps.push(`${unrehearsed} playbook(s) not rehearsed in last 30 days`);
      recommendations.push(`Rehearse ${unrehearsed} unrehearsed recovery playbook(s)`);
    }
    dimensions.push({
      dimension: "Recovery Playbook Rehearsal",
      score: Math.round(rehearsalPct),
      weight: WEIGHTS.RECOVERY_PLAYBOOK_REHEARSAL,
      evidence: rehearsalEvidence,
      gaps: rehearsalGaps,
    });

    // --- 6. Drill Freshness (10%) ---
    const activeScenarios = this.scenarios.getActive();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const freshDrills = activeScenarios.filter(
      (s) => s.lastDrillAt && new Date(s.lastDrillAt).getTime() > thirtyDaysAgo,
    ).length;
    const drillPct = activeScenarios.length > 0 ? (freshDrills / activeScenarios.length) * 100 : 0;
    const drillEvidence: string[] = [];
    const drillGaps: string[] = [];
    drillEvidence.push(`${freshDrills}/${activeScenarios.length} scenarios drilled in last 30 days`);
    if (freshDrills < activeScenarios.length) {
      const stale = activeScenarios.length - freshDrills;
      drillGaps.push(`${stale} scenario(s) not drilled in last 30 days`);
      recommendations.push(`Schedule drills for ${stale} stale scenario(s)`);
    }
    dimensions.push({
      dimension: "Drill Freshness",
      score: Math.round(drillPct),
      weight: WEIGHTS.DRILL_FRESHNESS,
      evidence: drillEvidence,
      gaps: drillGaps,
    });

    // --- Composite Score ---
    const composite = Math.round(
      dimensions.reduce((sum, d) => sum + d.score * d.weight, 0),
    );

    // Find last verified date across all sites
    const allSites = this.blackSites.getAll();
    let lastVerifiedAll: string | null = null;
    for (const site of allSites) {
      if (site.lastVerifiedAt) {
        if (!lastVerifiedAll || site.lastVerifiedAt > lastVerifiedAll) {
          lastVerifiedAll = site.lastVerifiedAt;
        }
      }
    }

    const result: BlackoutReadinessScore = {
      composite,
      category: categorise(composite),
      dimensions,
      scenarioCoverage: {
        total: coverage.total,
        covered: coverage.covered,
        drilled: coverage.drilled,
        stale: coverage.stale,
      },
      replicationHealth: {
        totalRules: repHealth.totalRules,
        healthy: repHealth.healthy,
        stale: repHealth.stale,
        failed: repHealth.failed,
      },
      blackSiteHealth: {
        totalSites,
        active: activeSites,
        dormant: totalSites - activeSites,
        lastVerifiedAll,
      },
      recommendations,
      computedAt: new Date().toISOString(),
    };

    this.lastScore = result;
    this.history.push(result);
    if (this.history.length > this.maxHistory) this.history.shift();

    return result;
  }

  getLast(): BlackoutReadinessScore | null {
    return this.lastScore;
  }

  getHistory(limit = 20): BlackoutReadinessScore[] {
    return this.history.slice(-limit);
  }

  getComposite(): number {
    return this.lastScore?.composite ?? 0;
  }

  getCategory(): BriCategory {
    return this.lastScore?.category ?? "EXPOSED";
  }
}
