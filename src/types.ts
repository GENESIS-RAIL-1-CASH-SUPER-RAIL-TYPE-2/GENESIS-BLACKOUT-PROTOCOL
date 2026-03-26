// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Type Definitions
// Catastrophic Loss Defence Doctrine
// "Like NORAD, Pentagon, Air Force One, Iron Mountain."
// "Decentralised. Expect nodes to fail. Network survives."
// "Protect what you love and survive."
// ============================================================================

// --- Scenario Library ---

export type ScenarioCategory =
  | "POWER_LOSS"
  | "CYBER_ATTACK"
  | "INFRASTRUCTURE_FAILURE"
  | "FINANCIAL_CRISIS"
  | "PHYSICAL_BREACH"
  | "EMP_ATTACK"
  | "REGULATORY_SHUTDOWN"
  | "SUPPLY_CHAIN_COMPROMISE"
  | "INSIDER_THREAT"
  | "SPACE_WEATHER"
  | "CASCADING_FAILURE"
  | "TOTAL_LOSS";

export type ScenarioSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "EXTINCTION";

export type ScenarioLikelihood = "RARE" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "CERTAIN";

export type ScenarioScope =
  | "SINGLE_SERVICE"
  | "SERVICE_CLUSTER"
  | "FULL_STACK"
  | "INFRASTRUCTURE"
  | "GEOGRAPHIC_REGION"
  | "GLOBAL";

export type ScenarioStatus =
  | "DRAFT"
  | "ACTIVE"
  | "UNDER_REVIEW"
  | "RETIRED"
  | "SUPERSEDED";

export interface ScenarioWarGameRef {
  warGameId: string;
  score: number;
  findings: string[];
  conductedAt: string;
}

export interface ThreatScenario {
  scenarioId: string;
  category: ScenarioCategory;
  title: string;
  description: string;
  severity: ScenarioSeverity;
  likelihood: ScenarioLikelihood;
  scope: ScenarioScope;
  status: ScenarioStatus;
  // What is affected
  affectedTiers: CrownJewelsTier[];
  affectedServices: string[];
  affectedInfrastructure: string[];
  // Response mapping
  failoverPlanId: string | null;
  recoveryPlaybookId: string | null;
  battleStationsCondition: "BRAVO" | "CHARLIE" | "DELTA";
  // Evolution tracking
  version: number;
  parentScenarioId: string | null;
  warGameResults: ScenarioWarGameRef[];
  // DARPA integration
  darpaMissionId: string | null;
  lastDrillAt: string | null;
  lastDrillScore: number | null;
  drillCount: number;
  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
  retiredAt: string | null;
}

// --- Black Site Registry ---

export type BlackSiteClassification = "TIER_0_SOVEREIGN" | "TIER_0_BACKUP";

export type BlackSiteType =
  | "PHYSICAL_COLD_STORAGE"
  | "GEOGRAPHIC_VPS"
  | "IPFS_PIN"
  | "SATELLITE_RECEIVER"
  | "COMMANDER_LOCAL"
  | "PEER_NODE";

export type BlackSiteStatus =
  | "ACTIVE"
  | "DORMANT"
  | "COMPROMISED"
  | "DECOMMISSIONED"
  | "PLANNED";

export type AccessLevel = "COMMANDER_ONLY" | "COMMANDER_AND_CEO";

export interface ReplicationManifest {
  tiers: CrownJewelsTier[];
  assets: string[];
  encryptionAlgorithm: string;
  keyRotationDays: number;
  lastReplicatedAt: string | null;
  lastVerifiedChecksum: string | null;
  checksumAlgorithm: string;
  retentionDays: number;
  sizeEstimateMB: number;
}

export interface BlackSite {
  siteId: string;
  encryptedName: string;
  encryptedLocation: string;
  siteType: BlackSiteType;
  classification: BlackSiteClassification;
  status: BlackSiteStatus;
  accessLevel: AccessLevel;
  replicationManifest: ReplicationManifest;
  deadDropProtocol: string | null;
  lastContactAt: string | null;
  lastVerifiedAt: string | null;
  arisVerified: boolean;
  arisLastCheckAt: string | null;
  arisVerdict: string | null;
  geographicZone: string;
  createdAt: string;
  updatedAt: string;
  decommissionedAt: string | null;
}

export interface BlackSiteSummary {
  siteId: string;
  siteType: BlackSiteType;
  classification: BlackSiteClassification;
  status: BlackSiteStatus;
  accessLevel: AccessLevel;
  geographicZone: string;
  arisVerified: boolean;
  lastVerifiedAt: string | null;
  lastContactAt: string | null;
}

// --- Replication Engine ---

export type CrownJewelsTier = "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";

export type ReplicationFrequency =
  | "CONTINUOUS"
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY";

export type ReplicationStatus =
  | "HEALTHY"
  | "STALE"
  | "FAILED"
  | "NEVER_RUN"
  | "IN_PROGRESS";

export interface ReplicationRule {
  ruleId: string;
  tier: CrownJewelsTier;
  frequency: ReplicationFrequency;
  targetSiteIds: string[];
  assets: string[];
  encryptionKeyRef: string;
  lastRunAt: string | null;
  lastRunStatus: ReplicationStatus;
  lastRunDurationMs: number | null;
  lastVerifiedAt: string | null;
  nextScheduledAt: string | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReplicationEvent {
  eventId: string;
  ruleId: string;
  tier: CrownJewelsTier;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  assetsReplicated: string[];
  assetsFailed: string[];
  siteId: string;
  checksumBefore: string | null;
  checksumAfter: string | null;
  checksumVerified: boolean;
  durationMs: number;
  sizeBytes: number;
  timestamp: string;
}

// --- Failover Orchestration ---

export type FailoverActionType =
  | "KILL_SWITCH_ACTIVATE"
  | "TREASURY_SWEEP"
  | "ACTIVATE_BLACK_SITE"
  | "ROTATE_ENCRYPTION_KEYS"
  | "NOTIFY_COMMANDER"
  | "NOTIFY_CEO"
  | "BATTLE_STATIONS_ESCALATE"
  | "GHOST_FLEET_ACTIVATE"
  | "DNS_FAILOVER"
  | "COLD_BOOT_FROM_BACKUP"
  | "ACTIVATE_WARM_STANDBY"
  | "SEAL_API_KEYS"
  | "EVIDENCE_PRESERVATION"
  | "DEAD_DROP_BROADCAST";

export interface FailoverAction {
  actionId: string;
  type: FailoverActionType;
  target: string;
  priority: number;
  timeoutMs: number;
  mandatory: boolean;
  description: string;
}

export interface FailoverPlan {
  planId: string;
  scenarioIds: string[];
  title: string;
  description: string;
  actions: FailoverAction[];
  estimatedRecoveryTimeMs: number;
  lastTestedAt: string | null;
  lastTestScore: number | null;
  autoExecute: boolean;
  commanderApprovalRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FailoverExecution {
  executionId: string;
  planId: string;
  scenarioId: string | null;
  isDrill: boolean;
  actions: FailoverActionResult[];
  overallSuccess: boolean;
  startedAt: string;
  completedAt: string | null;
  commanderApproved: boolean;
}

export interface FailoverActionResult {
  actionId: string;
  type: FailoverActionType;
  success: boolean;
  durationMs: number;
  error: string | null;
  timestamp: string;
}

// --- Recovery Playbooks ---

export interface RecoveryStep {
  stepNumber: number;
  title: string;
  description: string;
  automated: boolean;
  serviceTarget: string | null;
  verificationCommand: string | null;
  estimatedDurationMs: number;
  rollbackStep: number | null;
}

export interface RecoveryPlaybook {
  playbookId: string;
  scenarioIds: string[];
  title: string;
  description: string;
  steps: RecoveryStep[];
  prerequisites: string[];
  estimatedTotalDurationMs: number;
  lastRehearsedAt: string | null;
  lastRehearsalScore: number | null;
  rehearsalCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// --- Blackout Readiness Index (BRI) ---

export type BriCategory =
  | "FORTRESS"
  | "PREPARED"
  | "DEVELOPING"
  | "VULNERABLE"
  | "EXPOSED";

export interface ReadinessDimension {
  dimension: string;
  score: number;
  weight: number;
  evidence: string[];
  gaps: string[];
}

export interface BlackoutReadinessScore {
  composite: number;
  category: BriCategory;
  dimensions: ReadinessDimension[];
  scenarioCoverage: {
    total: number;
    covered: number;
    drilled: number;
    stale: number;
  };
  replicationHealth: {
    totalRules: number;
    healthy: number;
    stale: number;
    failed: number;
  };
  blackSiteHealth: {
    totalSites: number;
    active: number;
    dormant: number;
    lastVerifiedAll: string | null;
  };
  recommendations: string[];
  computedAt: string;
}

// --- Service State ---

export interface BlackoutProtocolState {
  totalScenarios: number;
  scenariosByCategory: Record<string, number>;
  scenariosByStatus: Record<string, number>;
  totalBlackSites: number;
  activeBlackSites: number;
  totalReplicationRules: number;
  healthyReplications: number;
  totalFailoverPlans: number;
  totalRecoveryPlaybooks: number;
  readinessScore: number;
  readinessCategory: BriCategory;
  lastDrillAt: string | null;
  lastReplicationAt: string | null;
  darpaMissionId: string | null;
  uptime: number;
}
