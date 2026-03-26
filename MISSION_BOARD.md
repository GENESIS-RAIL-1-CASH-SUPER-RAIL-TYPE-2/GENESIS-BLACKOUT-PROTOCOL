# GENESIS-BLACKOUT-PROTOCOL — Mission Board

> **Doctrine**: "Like NORAD, Pentagon, Air Force One, Iron Mountain. Decentralised. Expect nodes to fail. Network survives. Protect what you love and survive."

## Service Identity

| Field | Value |
|-------|-------|
| Port | 8860 |
| Tier | TIER_3 (Governance) |
| Status | OPERATIONAL |
| DARPA Mission | Perpetual — Catastrophic Loss Defence |

## 6 Core Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | Scenario Library | 12 catastrophic threat categories, evolving (version, not mutation) |
| 2 | Black Site Registry | AES-256-GCM encrypted, Commander+Xmas only, ARIS-verified |
| 3 | Replication Engine | Multi-site backup tied to Crown Jewels tiers (TIER_0 daily) |
| 4 | Failover Orchestration | 14 action types, 3 seed plans, drills by default |
| 5 | Recovery Playbooks | Step-by-step recovery per scenario, 5 seed playbooks |
| 6 | Readiness Score (BRI) | Blackout Readiness Index (0-100), 6 weighted dimensions |

## 12 Scenario Categories

| Category | Seed Scenario | Severity | DEFCON |
|----------|--------------|----------|--------|
| POWER_LOSS | EC2 Data Centre Outage | HIGH | CHARLIE |
| CYBER_ATTACK | Targeted DDoS / State-Actor Intrusion | CRITICAL | DELTA |
| INFRASTRUCTURE_FAILURE | AWS EU-West-2 Regional Outage | HIGH | CHARLIE |
| FINANCIAL_CRISIS | Major Exchange Collapse (FTX-type) | CRITICAL | CHARLIE |
| PHYSICAL_BREACH | Device Theft or Office Intrusion | HIGH | BRAVO |
| EMP_ATTACK | Electromagnetic Pulse / Solar Flare | EXTINCTION | DELTA |
| REGULATORY_SHUTDOWN | UK Government Crypto Ban | CRITICAL | CHARLIE |
| SUPPLY_CHAIN_COMPROMISE | NPM Package Poisoning | HIGH | CHARLIE |
| INSIDER_THREAT | Credential Leak / Rogue Operator | CRITICAL | DELTA |
| SPACE_WEATHER | Severe Solar Storm (Carrington-class) | EXTINCTION | DELTA |
| CASCADING_FAILURE | Multi-Exchange Dark + Network Partition | CRITICAL | CHARLIE |
| TOTAL_LOSS | Complete Infrastructure Destruction | EXTINCTION | DELTA |

## Blackout Readiness Index (BRI)

| Dimension | Weight | Measures |
|-----------|--------|----------|
| Scenario Coverage | 25% | % of scenarios with failover + recovery playbook |
| Replication Health | 25% | % of replication rules in HEALTHY status |
| Black Site Distribution | 15% | Geographic diversity + active sites |
| Failover Plan Testing | 15% | % of plans tested in last 30 days |
| Recovery Playbook Rehearsal | 10% | % of playbooks rehearsed in last 30 days |
| Drill Freshness | 10% | % of scenarios drilled in last 30 days |

**Categories**: FORTRESS (90-100) | PREPARED (70-89) | DEVELOPING (50-69) | VULNERABLE (30-49) | EXPOSED (0-29)

## 28 Endpoints

### Health & State (3)
- `GET /health` — Standard health + BRI summary
- `GET /state` — Full BlackoutProtocolState
- `GET /briefing` — Commander briefing (human-readable)

### Scenario Library (7)
- `POST /scenario/create` — Create new threat scenario
- `GET /scenario/:id` — Get scenario by ID
- `GET /scenarios` — List all (filter: category, severity, status)
- `PATCH /scenario/:id` — Update scenario
- `POST /scenario/:id/evolve` — Create new version (supersede old)
- `POST /scenario/:id/drill-result` — Record war game result
- `GET /scenarios/coverage` — Coverage report

### Black Sites (5) — Commander Auth Required
- `POST /blacksite/register` — Register new site
- `GET /blacksite/:id` — Site details (decrypted)
- `GET /blacksites` — Summary list
- `PATCH /blacksite/:id/status` — Update status
- `POST /blacksite/:id/verify` — Trigger ARIS verification

### Replication Engine (5)
- `POST /replication/rule/create` — Create replication rule
- `GET /replication/rules` — List all rules
- `GET /replication/status` — Overall replication health
- `POST /replication/trigger/:ruleId` — Manually trigger replication
- `GET /replication/history` — Recent replication events

### Failover Orchestration (4)
- `POST /failover/plan/create` — Create failover plan
- `GET /failover/plan/:id` — Plan details
- `GET /failover/plans` — List all plans
- `POST /failover/execute/:planId` — Execute failover (drill or real)

### Recovery Playbooks (3)
- `POST /recovery/playbook/create` — Create playbook
- `GET /recovery/playbook/:id` — Playbook details
- `GET /recovery/playbooks` — List all playbooks

### Readiness (1)
- `GET /readiness` — Full BRI computation

## 5 Perpetual Loops

| # | Loop | Interval | Purpose |
|---|------|----------|---------|
| 1 | Scenario Health Monitor | 120s | Flag uncovered/stale scenarios |
| 2 | Replication Watchdog | 300s | Check rules vs schedule, CIA warning if TIER_0 stale >48h |
| 3 | Black Site Heartbeat | 600s | Verify active sites, flag unverified >30d |
| 4 | Readiness Computation | 300s | Compute BRI, forward to GTC/Whiteboard, CIA warning if BRI <50 |
| 5 | DARPA Mission Sync | 600s | Register perpetual mission, sync status to CIA |

## 14 Failover Action Types

KILL_SWITCH_ACTIVATE, TREASURY_SWEEP, ACTIVATE_BLACK_SITE, ROTATE_ENCRYPTION_KEYS, NOTIFY_COMMANDER, NOTIFY_CEO, BATTLE_STATIONS_ESCALATE, GHOST_FLEET_ACTIVATE, DNS_FAILOVER, COLD_BOOT_FROM_BACKUP, ACTIVATE_WARM_STANDBY, SEAL_API_KEYS, EVIDENCE_PRESERVATION, DEAD_DROP_BROADCAST

## 3 Seed Failover Plans

| Plan | Actions | Recovery Time | Auto-Execute |
|------|---------|---------------|-------------|
| FAILOVER DELTA | 9 (full emergency) | 1 hour | No — Commander approval |
| FAILOVER INFRASTRUCTURE | 5 (cloud failure) | 2 hours | No — Commander approval |
| FAILOVER TOTAL LOSS | 6 (nuclear option) | 24 hours | No — Commander approval |

## 5 Seed Recovery Playbooks

| Playbook | Steps | Duration |
|----------|-------|----------|
| Full EC2 Recovery | 8 | 1 hour |
| Single Service Recovery | 4 | 5 minutes |
| Total Loss Recovery | 6 | 24 hours |
| Credential Rotation After Breach | 6 | 2 hours |
| Exchange Deplatform Response | 6 | 30 minutes |

## Integration Map

```
CIA ──threat intel──> Blackout (scenario evolution)
Blackout ──early warning──> CIA (if BRI < 50 or TIER_0 stale)
Blackout ──perpetual mission──> DARPA (register + findings)
Blackout ──scenario→DEFCON map──> Battle Stations
Blackout ──black site verify──> ARIS (legality check)
Blackout ──telemetry──> GTC
Blackout ──intel──> Whiteboard (drill results, readiness history)
Blackout ──audit──> Ledger Lite (failover execution trail)
```

## War Games Department Hook (Port 8861, NEXT)

- `GET /scenarios` — scenario library for war game selection
- `POST /scenario/:id/drill-result` — ingress for war game results
- `GET /failover/plans` — plans to test
- `GET /readiness` — scoring baseline

## Security

- Black site names + locations: field-level AES-256-GCM encryption
- Commander auth: `X-Commander-Auth` header (shared secret)
- Failover drills: simulated by default, real actions need `commanderApproved: true`
- ARIS verifies black site legality on every verification request
