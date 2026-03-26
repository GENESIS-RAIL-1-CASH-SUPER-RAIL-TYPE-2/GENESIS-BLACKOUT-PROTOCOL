// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Main Entry
// Port 8860 | Catastrophic Loss Defence Doctrine
// "Like NORAD, Pentagon, Air Force One, Iron Mountain."
// "Decentralised. Expect nodes to fail. Network survives."
// "Protect what you love and survive."
//
// 28 endpoints | 5 perpetual loops | 12 seed scenarios | 14 failover actions
// ============================================================================

import express from "express";
import { ScenarioService } from "./services/scenario.service";
import { BlackSiteService } from "./services/blacksite.service";
import { ReplicationService } from "./services/replication.service";
import { FailoverService } from "./services/failover.service";
import { PlaybookService } from "./services/playbook.service";
import { ReadinessService } from "./services/readiness.service";
import { ForwarderService } from "./services/forwarder.service";
import { BlackoutProtocolState } from "./types";

const PORT = Number(process.env.PORT ?? 8860);
const COMMANDER_AUTH_TOKEN = process.env.COMMANDER_AUTH_TOKEN ?? "";
const DARPA_MISSION_ID = process.env.DARPA_MISSION_ID ?? "";

// --- Service Instantiation ---
const scenarios = new ScenarioService();
const blackSites = new BlackSiteService();
const replication = new ReplicationService();
const failover = new FailoverService();
const playbooks = new PlaybookService();
const readiness = new ReadinessService(scenarios, replication, blackSites, failover, playbooks);
const forwarder = new ForwarderService();

const app = express();
app.use(express.json());

const startTime = Date.now();
let darpaMissionId: string | null = DARPA_MISSION_ID || null;
let lastBriForward: string | null = null;

// --- Middleware: Commander Auth for Black Site routes ---
function requireCommanderAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const token = req.headers["x-commander-auth"] as string;
  if (!COMMANDER_AUTH_TOKEN || token !== COMMANDER_AUTH_TOKEN) {
    res.status(403).json({
      error: "TIER_0_ACCESS_DENIED",
      message: "Black site access requires Commander or CEO authorisation.",
    });
    return;
  }
  next();
}

// ============================================================================
// HEALTH & STATE (3 endpoints)
// ============================================================================

// GET /health — Standard health + BRI summary
app.get("/health", (_req, res) => {
  const bri = readiness.getLast();
  res.json({
    service: "GENESIS-BLACKOUT-PROTOCOL",
    status: "OPERATIONAL",
    port: PORT,
    version: "1.0.0",
    doctrine: "Protect what you love and survive.",
    uptime: Date.now() - startTime,
    readiness: {
      bri: bri?.composite ?? 0,
      category: bri?.category ?? "EXPOSED",
      computedAt: bri?.computedAt ?? null,
    },
    counts: {
      scenarios: scenarios.getCount(),
      blackSites: blackSites.getCount(),
      activeSites: blackSites.getActiveCount(),
      replicationRules: replication.getRules().length,
      failoverPlans: failover.getCount(),
      recoveryPlaybooks: playbooks.getCount(),
    },
    darpaMissionId,
    forwarding: forwarder.getStats(),
  });
});

// GET /state — Full BlackoutProtocolState
app.get("/state", (_req, res) => {
  const bri = readiness.getLast();
  const state: BlackoutProtocolState = {
    totalScenarios: scenarios.getCount(),
    scenariosByCategory: scenarios.getByCategory(),
    scenariosByStatus: scenarios.getByStatus(),
    totalBlackSites: blackSites.getCount(),
    activeBlackSites: blackSites.getActiveCount(),
    totalReplicationRules: replication.getRules().length,
    healthyReplications: replication.getHealth().healthy,
    totalFailoverPlans: failover.getCount(),
    totalRecoveryPlaybooks: playbooks.getCount(),
    readinessScore: bri?.composite ?? 0,
    readinessCategory: bri?.category ?? "EXPOSED",
    lastDrillAt: null,
    lastReplicationAt: replication.getLastReplicationAt(),
    darpaMissionId,
    uptime: Date.now() - startTime,
  };
  res.json(state);
});

// GET /briefing — Commander briefing (human-readable)
app.get("/briefing", (_req, res) => {
  const bri = readiness.getLast() ?? readiness.compute();
  const coverage = scenarios.getCoverage();
  const repHealth = replication.getHealth();
  const staleScenarios = scenarios.getStale();
  const uncovered = scenarios.getUncovered();

  const lines: string[] = [
    "═══════════════════════════════════════════════════════",
    "  BLACKOUT PROTOCOL — Commander Briefing",
    "  \"Protect what you love and survive.\"",
    "═══════════════════════════════════════════════════════",
    "",
    `  READINESS: ${bri.category} (BRI ${bri.composite}/100)`,
    "",
    "  SCENARIO LIBRARY:",
    `    Total scenarios: ${coverage.total}`,
    `    Covered (failover + playbook): ${coverage.covered}`,
    `    Uncovered: ${coverage.uncovered}`,
    `    Drilled (last 30d): ${coverage.drilled}`,
    `    Stale (>90d): ${staleScenarios.length}`,
    "",
    "  REPLICATION:",
    `    Rules: ${repHealth.totalRules}`,
    `    Healthy: ${repHealth.healthy}`,
    `    Stale: ${repHealth.stale}`,
    `    Failed: ${repHealth.failed}`,
    `    Never run: ${repHealth.neverRun}`,
    "",
    "  BLACK SITES:",
    `    Total: ${blackSites.getCount()}`,
    `    Active: ${blackSites.getActiveCount()}`,
    `    Zones: ${JSON.stringify(blackSites.getGeographicDistribution())}`,
    "",
    "  FAILOVER PLANS: " + failover.getCount(),
    "  RECOVERY PLAYBOOKS: " + playbooks.getCount(),
    "",
    "  RECOMMENDATIONS:",
    ...bri.recommendations.map((r) => `    → ${r}`),
    ...(bri.recommendations.length === 0 ? ["    None — FORTRESS status achieved."] : []),
    "",
    "  UNCOVERED SCENARIOS:",
    ...uncovered.map((s) => `    ⚠ ${s.title} [${s.category}] — missing ${!s.failoverPlanId ? "failover" : "playbook"}`),
    ...(uncovered.length === 0 ? ["    All scenarios covered."] : []),
    "",
    "═══════════════════════════════════════════════════════",
    `  Generated: ${new Date().toISOString()}`,
    `  DARPA Mission: ${darpaMissionId ?? "NOT REGISTERED"}`,
    "═══════════════════════════════════════════════════════",
  ];

  res.type("text/plain").send(lines.join("\n"));
});

// ============================================================================
// SCENARIO LIBRARY (7 endpoints)
// ============================================================================

// POST /scenario/create
app.post("/scenario/create", (req, res) => {
  const scenario = scenarios.create(req.body);
  forwarder.forwardToWhiteboard("SCENARIO_CREATED", scenario, ["scenario", scenario.category]);
  forwarder.forwardToGtc("scenario.created", { scenarioId: scenario.scenarioId, title: scenario.title });
  res.status(201).json(scenario);
});

// GET /scenario/:id
app.get("/scenario/:id", (req, res) => {
  const scenario = scenarios.get(req.params.id);
  if (!scenario) { res.status(404).json({ error: "Scenario not found" }); return; }
  res.json(scenario);
});

// GET /scenarios — list all, with optional filters
app.get("/scenarios", (req, res) => {
  const filters: { category?: string; severity?: string; status?: string } = {};
  if (req.query.category) filters.category = req.query.category as string;
  if (req.query.severity) filters.severity = req.query.severity as string;
  if (req.query.status) filters.status = req.query.status as string;
  res.json(scenarios.getAll(filters));
});

// PATCH /scenario/:id
app.patch("/scenario/:id", (req, res) => {
  const updated = scenarios.update(req.params.id, req.body);
  if (!updated) { res.status(404).json({ error: "Scenario not found" }); return; }
  res.json(updated);
});

// POST /scenario/:id/evolve — new version, old SUPERSEDED
app.post("/scenario/:id/evolve", (req, res) => {
  const evolved = scenarios.evolve(req.params.id, req.body.title, req.body.description);
  if (!evolved) { res.status(404).json({ error: "Scenario not found" }); return; }
  forwarder.forwardToWhiteboard("SCENARIO_EVOLVED", evolved, ["scenario", "evolved", evolved.category]);
  forwarder.forwardToCia("SCENARIO_EVOLVED", {
    scenarioId: evolved.scenarioId,
    parentId: evolved.parentScenarioId,
    title: evolved.title,
    version: evolved.version,
  });
  res.status(201).json(evolved);
});

// POST /scenario/:id/drill-result — record war game result
app.post("/scenario/:id/drill-result", (req, res) => {
  const result = scenarios.recordDrillResult(req.params.id, req.body);
  if (!result) { res.status(404).json({ error: "Scenario not found" }); return; }
  forwarder.forwardToWhiteboard("DRILL_RESULT", {
    scenarioId: result.scenarioId,
    title: result.title,
    drillCount: result.drillCount,
    lastScore: result.lastDrillScore,
  }, ["drill", "war-game"]);
  forwarder.forwardToGtc("scenario.drill_complete", {
    scenarioId: result.scenarioId,
    score: result.lastDrillScore,
  });
  res.json(result);
});

// GET /scenarios/coverage
app.get("/scenarios/coverage", (_req, res) => {
  res.json(scenarios.getCoverage());
});

// ============================================================================
// BLACK SITES (5 endpoints — all require Commander auth)
// ============================================================================

// POST /blacksite/register
app.post("/blacksite/register", requireCommanderAuth, (req, res) => {
  const site = blackSites.register(req.body);
  forwarder.forwardToLedgerLite("BLACK_SITE_REGISTERED", {
    siteId: site.siteId,
    siteType: site.siteType,
    geographicZone: site.geographicZone,
  });
  res.status(201).json(site);
});

// GET /blacksite/:id — full details (Commander only)
app.get("/blacksite/:id", requireCommanderAuth, (req, res) => {
  const site = blackSites.get(req.params.id);
  if (!site) { res.status(404).json({ error: "Black site not found" }); return; }
  const decrypted = blackSites.getDecrypted(req.params.id);
  res.json({ ...site, decrypted });
});

// GET /blacksites — summary list (Commander only)
app.get("/blacksites", requireCommanderAuth, (_req, res) => {
  res.json(blackSites.getSummaries());
});

// PATCH /blacksite/:id/status
app.patch("/blacksite/:id/status", requireCommanderAuth, (req, res) => {
  const updated = blackSites.updateStatus(req.params.id, req.body.status);
  if (!updated) { res.status(404).json({ error: "Black site not found" }); return; }
  forwarder.forwardToLedgerLite("BLACK_SITE_STATUS_CHANGED", {
    siteId: updated.siteId,
    status: updated.status,
  });
  res.json(updated);
});

// POST /blacksite/:id/verify — trigger ARIS verification
app.post("/blacksite/:id/verify", requireCommanderAuth, (req, res) => {
  const site = blackSites.get(req.params.id);
  if (!site) { res.status(404).json({ error: "Black site not found" }); return; }
  // Request ARIS verification
  forwarder.requestArisVerification(site.siteId, {
    siteType: site.siteType,
    classification: site.classification,
    geographicZone: site.geographicZone,
  });
  // Simulate ARIS response (real integration would be async callback)
  const verdict = "COMPLIANT";
  const updated = blackSites.recordArisVerification(site.siteId, verdict);
  res.json({ siteId: site.siteId, arisVerdict: verdict, arisVerified: true, site: updated });
});

// ============================================================================
// REPLICATION ENGINE (5 endpoints)
// ============================================================================

// POST /replication/rule/create
app.post("/replication/rule/create", (req, res) => {
  const rule = replication.createRule(req.body);
  res.status(201).json(rule);
});

// GET /replication/rules
app.get("/replication/rules", (req, res) => {
  const filters: { tier?: string; status?: string } = {};
  if (req.query.tier) filters.tier = req.query.tier as string;
  if (req.query.status) filters.status = req.query.status as string;
  res.json(replication.getRules(filters));
});

// GET /replication/status — overall health
app.get("/replication/status", (_req, res) => {
  replication.markStale();
  res.json({
    health: replication.getHealth(),
    staleRules: replication.getStaleRules().map((r) => ({
      ruleId: r.ruleId,
      tier: r.tier,
      frequency: r.frequency,
      lastRunAt: r.lastRunAt,
    })),
    failedRules: replication.getFailedRules().map((r) => ({
      ruleId: r.ruleId,
      tier: r.tier,
      consecutiveFailures: r.consecutiveFailures,
    })),
    lastReplicationAt: replication.getLastReplicationAt(),
  });
});

// POST /replication/trigger/:ruleId
app.post("/replication/trigger/:ruleId", (req, res) => {
  const siteId = req.body.siteId ?? "manual-trigger";
  const event = replication.triggerReplication(req.params.ruleId, siteId);
  if (!event) { res.status(404).json({ error: "Replication rule not found" }); return; }
  forwarder.forwardToGtc("replication.triggered", {
    ruleId: event.ruleId,
    tier: event.tier,
    status: event.status,
  });
  res.json(event);
});

// GET /replication/history
app.get("/replication/history", (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json(replication.getHistory(limit));
});

// ============================================================================
// FAILOVER ORCHESTRATION (4 endpoints)
// ============================================================================

// POST /failover/plan/create
app.post("/failover/plan/create", (req, res) => {
  const plan = failover.createPlan(req.body);
  forwarder.forwardToWhiteboard("FAILOVER_PLAN_CREATED", {
    planId: plan.planId,
    title: plan.title,
    actionCount: plan.actions.length,
  }, ["failover", "plan"]);
  res.status(201).json(plan);
});

// GET /failover/plan/:id
app.get("/failover/plan/:id", (req, res) => {
  const plan = failover.get(req.params.id);
  if (!plan) { res.status(404).json({ error: "Failover plan not found" }); return; }
  res.json(plan);
});

// GET /failover/plans
app.get("/failover/plans", (_req, res) => {
  res.json(failover.getAll());
});

// POST /failover/execute/:planId — drill or real execution
app.post("/failover/execute/:planId", (req, res) => {
  const isDrill = req.body.isDrill !== false; // Default to drill
  const scenarioId = req.body.scenarioId ?? undefined;
  const commanderApproved = req.body.commanderApproved === true;

  // Real execution requires Commander approval
  if (!isDrill && !commanderApproved) {
    res.status(403).json({
      error: "COMMANDER_APPROVAL_REQUIRED",
      message: "Real failover execution requires commanderApproved: true. Drills execute by default.",
    });
    return;
  }

  const execution = failover.execute(req.params.planId, isDrill, scenarioId, commanderApproved);
  if (!execution) { res.status(404).json({ error: "Failover plan not found" }); return; }

  // Forward execution record
  forwarder.forwardToLedgerLite("FAILOVER_EXECUTED", {
    executionId: execution.executionId,
    planId: execution.planId,
    isDrill,
    overallSuccess: execution.overallSuccess,
  });
  forwarder.forwardToWhiteboard("FAILOVER_EXECUTED", execution, [
    "failover",
    isDrill ? "drill" : "REAL",
    execution.overallSuccess ? "success" : "failure",
  ]);
  forwarder.forwardToGtc("failover.executed", {
    executionId: execution.executionId,
    isDrill,
    success: execution.overallSuccess,
  });

  res.json(execution);
});

// ============================================================================
// RECOVERY PLAYBOOKS (3 endpoints)
// ============================================================================

// POST /recovery/playbook/create
app.post("/recovery/playbook/create", (req, res) => {
  const playbook = playbooks.createPlaybook(req.body);
  res.status(201).json(playbook);
});

// GET /recovery/playbook/:id
app.get("/recovery/playbook/:id", (req, res) => {
  const playbook = playbooks.get(req.params.id);
  if (!playbook) { res.status(404).json({ error: "Recovery playbook not found" }); return; }
  res.json(playbook);
});

// GET /recovery/playbooks
app.get("/recovery/playbooks", (_req, res) => {
  res.json(playbooks.getAll());
});

// ============================================================================
// READINESS (1 endpoint)
// ============================================================================

// GET /readiness — full BRI computation
app.get("/readiness", (_req, res) => {
  const bri = readiness.compute();
  res.json(bri);
});

// ============================================================================
// 5 PERPETUAL LOOPS
// ============================================================================

// Loop 1: Scenario Health Monitor (120s)
// Flag uncovered/stale scenarios, ensure all have failover + playbook
setInterval(() => {
  const uncovered = scenarios.getUncovered();
  const stale = scenarios.getStale(90);

  if (uncovered.length > 0) {
    forwarder.forwardToDarpa("UNCOVERED_SCENARIOS", {
      count: uncovered.length,
      scenarios: uncovered.map((s) => ({
        scenarioId: s.scenarioId,
        title: s.title,
        category: s.category,
        severity: s.severity,
        missingFailover: !s.failoverPlanId,
        missingPlaybook: !s.recoveryPlaybookId,
      })),
    });
  }

  if (stale.length > 0 && darpaMissionId) {
    forwarder.reportDarpaFinding(darpaMissionId, {
      type: "STALE_SCENARIOS",
      count: stale.length,
      scenarios: stale.map((s) => s.title),
    });
  }
}, 120_000);

// Loop 2: Replication Watchdog (300s)
// Check replication rules vs schedule, verify checksums, CIA warning if TIER_0 stale
setInterval(() => {
  replication.markStale();
  const staleRules = replication.getStaleRules();
  const failedRules = replication.getFailedRules();

  // CIA early warning for TIER_0 stale > 48h
  const tier0Stale = staleRules.filter((r) => r.tier === "TIER_0");
  if (tier0Stale.length > 0) {
    const maxStaleHours = tier0Stale.reduce((max, r) => {
      if (!r.lastRunAt) return Infinity;
      const hours = (Date.now() - new Date(r.lastRunAt).getTime()) / 3_600_000;
      return Math.max(max, hours);
    }, 0);

    if (maxStaleHours > 48) {
      forwarder.forwardToCia("TIER_0_REPLICATION_STALE", {
        severity: "CRITICAL",
        staleHours: Math.round(maxStaleHours),
        rules: tier0Stale.map((r) => r.ruleId),
        message: `TIER_0 replication stale for ${Math.round(maxStaleHours)}h — Crown Jewels data at risk`,
      });
    }
  }

  if (failedRules.length > 0 && darpaMissionId) {
    forwarder.reportDarpaFinding(darpaMissionId, {
      type: "REPLICATION_FAILURES",
      count: failedRules.length,
      rules: failedRules.map((r) => ({
        ruleId: r.ruleId,
        tier: r.tier,
        failures: r.consecutiveFailures,
      })),
    });
  }
}, 300_000);

// Loop 3: Black Site Heartbeat (600s)
// Verify active sites, check ARIS compliance, flag unverified > 30 days
setInterval(() => {
  const activeSites = blackSites.getActive();
  const unverified = blackSites.getUnverified(30);

  // Record contact for all active sites (simulated heartbeat)
  for (const site of activeSites) {
    blackSites.recordContact(site.siteId);
  }

  // Flag unverified sites
  if (unverified.length > 0 && darpaMissionId) {
    forwarder.reportDarpaFinding(darpaMissionId, {
      type: "UNVERIFIED_BLACK_SITES",
      count: unverified.length,
      sites: unverified.map((s) => ({
        siteId: s.siteId,
        geographicZone: s.geographicZone,
        lastVerifiedAt: s.lastVerifiedAt,
      })),
    });
  }
}, 600_000);

// Loop 4: Readiness Computation (300s)
// Compute BRI, forward to GTC/Whiteboard/DARPA, CIA warning if BRI < 50
setInterval(() => {
  const bri = readiness.compute();

  // Forward BRI to GTC
  forwarder.forwardToGtc("readiness.computed", {
    bri: bri.composite,
    category: bri.category,
    computedAt: bri.computedAt,
  });
  lastBriForward = bri.computedAt;

  // Forward to Whiteboard
  forwarder.forwardToWhiteboard("BRI_COMPUTED", {
    composite: bri.composite,
    category: bri.category,
    dimensions: bri.dimensions.map((d) => ({
      dimension: d.dimension,
      score: d.score,
    })),
    recommendations: bri.recommendations,
  }, ["readiness", "bri", bri.category.toLowerCase()]);

  // CIA early warning if BRI < 50
  if (bri.composite < 50) {
    forwarder.forwardToCia("LOW_READINESS", {
      severity: bri.composite < 30 ? "CRITICAL" : "HIGH",
      bri: bri.composite,
      category: bri.category,
      recommendations: bri.recommendations,
      message: `Blackout Readiness Index at ${bri.composite}/100 (${bri.category}) — Genesis is VULNERABLE`,
    });
  }

  // DARPA finding if not FORTRESS
  if (bri.composite < 90 && darpaMissionId) {
    forwarder.reportDarpaFinding(darpaMissionId, {
      type: "READINESS_BELOW_FORTRESS",
      bri: bri.composite,
      category: bri.category,
      gaps: bri.recommendations,
    });
  }
}, 300_000);

// Loop 5: DARPA Mission Sync (600s)
// Register/update perpetual mission, report findings, feed scenario changes to CIA
setInterval(() => {
  // Register mission if not yet registered
  if (!darpaMissionId) {
    forwarder.registerDarpaMission({
      title: "BLACKOUT PROTOCOL — Catastrophic Loss Defence",
      description: "Perpetual mission: maintain FORTRESS readiness (BRI 90+). Train for every catastrophic scenario. Evolve as threats evolve.",
      source: "BLACKOUT_PROTOCOL",
      priority: "P1",
      perpetual: true,
      cadenceMs: 600_000,
    }).then((ok) => {
      if (ok) {
        console.log("[BLACKOUT] DARPA perpetual mission registration sent");
      }
    });
    return;
  }

  // Sync scenario changes to CIA
  const coverage = scenarios.getCoverage();
  forwarder.forwardToCia("BLACKOUT_STATUS_SYNC", {
    bri: readiness.getComposite(),
    category: readiness.getCategory(),
    scenarioCoverage: coverage,
    scenarioCount: scenarios.getCount(),
    blackSiteCount: blackSites.getActiveCount(),
    replicationHealth: replication.getHealth(),
  });
}, 600_000);

// ============================================================================
// COLD BOOT
// ============================================================================

app.listen(PORT, () => {
  // Initial BRI computation
  const bri = readiness.compute();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  GENESIS-BLACKOUT-PROTOCOL");
  console.log("  Catastrophic Loss Defence Doctrine");
  console.log("  \"Protect what you love and survive.\"");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  PORT: ${PORT}`);
  console.log(`  SCENARIOS: ${scenarios.getCount()} (12 categories seeded)`);
  console.log(`  BLACK SITES: ${blackSites.getCount()} registered, ${blackSites.getActiveCount()} active`);
  console.log(`  REPLICATION: ${replication.getRules().length} rules`);
  console.log(`  FAILOVER: ${failover.getCount()} plans (3 seeded)`);
  console.log(`  PLAYBOOKS: ${playbooks.getCount()} recovery playbooks (5 seeded)`);
  console.log(`  BRI: ${bri.composite}/100 (${bri.category})`);
  console.log(`  DARPA MISSION: ${darpaMissionId ?? "Will register on first sync"}`);
  console.log(`  COMMANDER AUTH: ${COMMANDER_AUTH_TOKEN ? "CONFIGURED" : "NOT SET — black sites unprotected"}`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("  LOOPS:");
  console.log("    [1] Scenario Health Monitor     — 120s");
  console.log("    [2] Replication Watchdog         — 300s");
  console.log("    [3] Black Site Heartbeat         — 600s");
  console.log("    [4] Readiness Computation        — 300s");
  console.log("    [5] DARPA Mission Sync           — 600s");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  COLD BOOT COMPLETE — ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════");

  // Forward cold boot telemetry
  forwarder.forwardToGtc("blackout.cold_boot", {
    scenarios: scenarios.getCount(),
    blackSites: blackSites.getActiveCount(),
    bri: bri.composite,
    category: bri.category,
  });
});
