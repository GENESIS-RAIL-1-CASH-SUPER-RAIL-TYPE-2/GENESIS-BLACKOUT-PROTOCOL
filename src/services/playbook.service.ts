// ============================================================================
// GENESIS-BLACKOUT-PROTOCOL — Playbook Service
// Step-by-step recovery procedures per scenario. Manual or semi-automated.
// 5 seed playbooks covering the most critical recovery paths.
// ============================================================================

import { randomUUID } from "crypto";
import { RecoveryPlaybook, RecoveryStep } from "../types";

interface SeedPlaybook {
  title: string;
  description: string;
  prerequisites: string[];
  steps: RecoveryStep[];
  estimatedTotalDurationMs: number;
}

const SEED_PLAYBOOKS: SeedPlaybook[] = [
  {
    title: "Full EC2 Recovery",
    description: "Complete recovery from encrypted backup when EC2 instance is lost. Mirrors Crown Jewels BACKUP-PROTOCOL.md.",
    prerequisites: ["Encrypted backup file", "Decryption passphrase", "AWS account access", "Docker images in registry"],
    steps: [
      { stepNumber: 1, title: "Provision new EC2 instance", description: "Launch t3.xlarge in eu-west-2 with 100GB EBS. Apply security group.", automated: false, serviceTarget: "AWS", verificationCommand: "ssh -i key.pem ec2-user@NEW_IP", estimatedDurationMs: 600000, rollbackStep: null },
      { stepNumber: 2, title: "Install Docker + Docker Compose", description: "Install Docker, Docker Compose, and Node 20 on fresh instance.", automated: true, serviceTarget: "EC2", verificationCommand: "docker --version && docker compose version", estimatedDurationMs: 300000, rollbackStep: null },
      { stepNumber: 3, title: "Decrypt backup", description: "openssl enc -d -aes-256-cbc -pbkdf2 -in backup.enc | tar xzf -", automated: true, serviceTarget: "EC2", verificationCommand: "ls -la /app/data/", estimatedDurationMs: 120000, rollbackStep: null },
      { stepNumber: 4, title: "Copy data to container volumes", description: "Copy decrypted data directories into correct container volume paths.", automated: true, serviceTarget: "Docker", verificationCommand: "docker volume ls", estimatedDurationMs: 180000, rollbackStep: null },
      { stepNumber: 5, title: "Pull and start all containers", description: "docker compose up -d. Wait for all services to initialise.", automated: true, serviceTarget: "Docker", verificationCommand: "docker compose ps", estimatedDurationMs: 300000, rollbackStep: null },
      { stepNumber: 6, title: "Verify stack health", description: "curl localhost:8820/readiness — expect MISSION_CAPABLE or better.", automated: true, serviceTarget: "Toolkit:8820", verificationCommand: "curl localhost:8820/readiness", estimatedDurationMs: 60000, rollbackStep: 5 },
      { stepNumber: 7, title: "Verify hash chain integrity", description: "Check Ledger Lite hash chain is intact. Run recovery if needed.", automated: true, serviceTarget: "Ledger Lite:8500", verificationCommand: "curl localhost:8500/health", estimatedDurationMs: 60000, rollbackStep: null },
      { stepNumber: 8, title: "Rotate API keys", description: "Generate new API keys for all exchanges. Old keys potentially compromised.", automated: false, serviceTarget: "Exchanges", verificationCommand: null, estimatedDurationMs: 600000, rollbackStep: null },
    ],
    estimatedTotalDurationMs: 3600000, // 1 hour
  },
  {
    title: "Single Service Recovery",
    description: "Restore a single failed service from backup and Docker restart.",
    prerequisites: ["Docker running", "Container image available"],
    steps: [
      { stepNumber: 1, title: "Identify failed service", description: "Check Toolkit /services/red for the failed service name and tier.", automated: true, serviceTarget: "Toolkit:8820", verificationCommand: "curl localhost:8820/services/red", estimatedDurationMs: 10000, rollbackStep: null },
      { stepNumber: 2, title: "Check dependencies", description: "Verify all upstream dependencies are GREEN before restarting.", automated: true, serviceTarget: "Toolkit:8820", verificationCommand: null, estimatedDurationMs: 10000, rollbackStep: null },
      { stepNumber: 3, title: "Restart container", description: "docker restart genesis-SERVICE-NAME. Wait 30s for initialisation.", automated: true, serviceTarget: "Docker", verificationCommand: "docker ps | grep SERVICE", estimatedDurationMs: 60000, rollbackStep: null },
      { stepNumber: 4, title: "Verify health", description: "curl localhost:PORT/health — expect 200 OK.", automated: true, serviceTarget: "Service", verificationCommand: "curl localhost:PORT/health", estimatedDurationMs: 30000, rollbackStep: 3 },
    ],
    estimatedTotalDurationMs: 300000, // 5 minutes
  },
  {
    title: "Total Loss Recovery",
    description: "Bootstrap Genesis from cold black site backup. Everything else is gone. Last resort.",
    prerequisites: ["Access to at least one black site", "Decryption key (Commander memory)", "Internet access", "New hardware or cloud account"],
    steps: [
      { stepNumber: 1, title: "Retrieve encrypted backup from black site", description: "Use dead drop protocol to retrieve latest backup from most distant active site.", automated: false, serviceTarget: "Black Site", verificationCommand: null, estimatedDurationMs: 14400000, rollbackStep: null },
      { stepNumber: 2, title: "Provision new infrastructure", description: "Set up new cloud instance or local hardware. Any provider, any region.", automated: false, serviceTarget: "New Infrastructure", verificationCommand: null, estimatedDurationMs: 3600000, rollbackStep: null },
      { stepNumber: 3, title: "Decrypt and restore", description: "Decrypt backup with Commander passphrase. Restore all TIER_0 and TIER_1 data.", automated: false, serviceTarget: "New Infrastructure", verificationCommand: null, estimatedDurationMs: 1800000, rollbackStep: null },
      { stepNumber: 4, title: "Rotate ALL credentials", description: "Every API key, every secret, every wallet address. Assume ALL compromised.", automated: false, serviceTarget: "All Services", verificationCommand: null, estimatedDurationMs: 7200000, rollbackStep: null },
      { stepNumber: 5, title: "Rebuild Docker stack", description: "Pull fresh images, deploy with new credentials.", automated: true, serviceTarget: "Docker", verificationCommand: "docker compose ps", estimatedDurationMs: 1800000, rollbackStep: null },
      { stepNumber: 6, title: "Verify full stack", description: "Run Toolkit pre-flight check. Expect GREEN before any trading.", automated: true, serviceTarget: "Toolkit:8820", verificationCommand: "curl localhost:8820/preflight/status", estimatedDurationMs: 300000, rollbackStep: 5 },
    ],
    estimatedTotalDurationMs: 86400000, // 24 hours
  },
  {
    title: "Credential Rotation After Breach",
    description: "Full credential rotation procedure after confirmed or suspected breach.",
    prerequisites: ["Commander authorisation", "Exchange access (web UI)", "New IP address (if compromised)"],
    steps: [
      { stepNumber: 1, title: "Kill switch — halt all trading", description: "POST kill-switch-v2:7100/payload/kill with reason CREDENTIAL_BREACH.", automated: true, serviceTarget: "Kill Switch:7100", verificationCommand: "curl localhost:7100/payload/status", estimatedDurationMs: 5000, rollbackStep: null },
      { stepNumber: 2, title: "Revoke ALL exchange API keys", description: "Log into each exchange web UI. Delete all existing API keys.", automated: false, serviceTarget: "Exchanges", verificationCommand: null, estimatedDurationMs: 1800000, rollbackStep: null },
      { stepNumber: 3, title: "Rotate encryption keys", description: "Generate new BLACKOUT_ENCRYPTION_KEY, re-encrypt all black site data.", automated: false, serviceTarget: "Blackout Protocol", verificationCommand: null, estimatedDurationMs: 600000, rollbackStep: null },
      { stepNumber: 4, title: "Generate new API keys", description: "Create new API keys on each exchange with fresh IP whitelist.", automated: false, serviceTarget: "Exchanges", verificationCommand: null, estimatedDurationMs: 3600000, rollbackStep: null },
      { stepNumber: 5, title: "Update environment variables", description: "Deploy new keys to docker-compose.yml and restart affected services.", automated: true, serviceTarget: "Docker", verificationCommand: "docker compose ps", estimatedDurationMs: 300000, rollbackStep: null },
      { stepNumber: 6, title: "Reset kill switch", description: "POST kill-switch-v2:7100/payload/reset. Resume operations.", automated: true, serviceTarget: "Kill Switch:7100", verificationCommand: "curl localhost:7100/payload/status", estimatedDurationMs: 5000, rollbackStep: null },
    ],
    estimatedTotalDurationMs: 7200000, // 2 hours
  },
  {
    title: "Exchange Deplatform Response",
    description: "Procedure when an exchange goes dark or deplatforms Genesis. Protect trapped capital.",
    prerequisites: ["Exchange status confirmed DOWN/DEPLATFORMED", "Treasury Sentinel balance data"],
    steps: [
      { stepNumber: 1, title: "Confirm exchange status", description: "Verify via multiple sources: exchange website, social media, status page.", automated: false, serviceTarget: "External", verificationCommand: null, estimatedDurationMs: 300000, rollbackStep: null },
      { stepNumber: 2, title: "Assess trapped capital", description: "Query Treasury Sentinel for last known balance on affected exchange.", automated: true, serviceTarget: "Treasury Sentinel:8660", verificationCommand: "curl localhost:8660/health", estimatedDurationMs: 30000, rollbackStep: null },
      { stepNumber: 3, title: "Disable affected ingestor", description: "Stop the exchange ingestor container to prevent errors.", automated: true, serviceTarget: "Docker", verificationCommand: null, estimatedDurationMs: 30000, rollbackStep: null },
      { stepNumber: 4, title: "Update ARIS risk assessment", description: "Flag exchange as HALT in ARIS. Block all routing to this venue.", automated: true, serviceTarget: "ARIS:8798", verificationCommand: null, estimatedDurationMs: 30000, rollbackStep: null },
      { stepNumber: 5, title: "Record in Ledger Lite", description: "Create audit entry for capital at risk. Preserve evidence for potential legal action.", automated: true, serviceTarget: "Ledger Lite:8500", verificationCommand: null, estimatedDurationMs: 30000, rollbackStep: null },
      { stepNumber: 6, title: "Commander review", description: "Await Commander decision: wait for recovery, legal action, or write-off.", automated: false, serviceTarget: "Commander", verificationCommand: null, estimatedDurationMs: 0, rollbackStep: null },
    ],
    estimatedTotalDurationMs: 1800000, // 30 minutes active + Commander wait
  },
];

export class PlaybookService {
  private playbooks: Map<string, RecoveryPlaybook> = new Map();

  constructor() {
    this.seedPlaybooks();
  }

  private seedPlaybooks(): void {
    const now = new Date().toISOString();
    for (const seed of SEED_PLAYBOOKS) {
      const id = `BKO-PB-${randomUUID().slice(0, 12)}`;
      const playbook: RecoveryPlaybook = {
        playbookId: id,
        scenarioIds: [],
        title: seed.title,
        description: seed.description,
        steps: seed.steps,
        prerequisites: seed.prerequisites,
        estimatedTotalDurationMs: seed.estimatedTotalDurationMs,
        lastRehearsedAt: null,
        lastRehearsalScore: null,
        rehearsalCount: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      this.playbooks.set(id, playbook);
    }
  }

  createPlaybook(input: {
    title: string;
    description: string;
    scenarioIds?: string[];
    steps: RecoveryStep[];
    prerequisites?: string[];
    estimatedTotalDurationMs: number;
  }): RecoveryPlaybook {
    const now = new Date().toISOString();
    const id = `BKO-PB-${randomUUID().slice(0, 12)}`;
    const playbook: RecoveryPlaybook = {
      playbookId: id,
      scenarioIds: input.scenarioIds ?? [],
      title: input.title,
      description: input.description,
      steps: input.steps,
      prerequisites: input.prerequisites ?? [],
      estimatedTotalDurationMs: input.estimatedTotalDurationMs,
      lastRehearsedAt: null,
      lastRehearsalScore: null,
      rehearsalCount: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.playbooks.set(id, playbook);
    return playbook;
  }

  get(id: string): RecoveryPlaybook | undefined {
    return this.playbooks.get(id);
  }

  getAll(): RecoveryPlaybook[] {
    return Array.from(this.playbooks.values());
  }

  update(id: string, partial: Partial<RecoveryPlaybook>): RecoveryPlaybook | undefined {
    const playbook = this.playbooks.get(id);
    if (!playbook) return undefined;
    Object.assign(playbook, partial, { updatedAt: new Date().toISOString() });
    return playbook;
  }

  recordRehearsal(id: string, score: number): RecoveryPlaybook | undefined {
    const playbook = this.playbooks.get(id);
    if (!playbook) return undefined;
    playbook.lastRehearsedAt = new Date().toISOString();
    playbook.lastRehearsalScore = score;
    playbook.rehearsalCount++;
    playbook.updatedAt = playbook.lastRehearsedAt;
    return playbook;
  }

  getCount(): number {
    return this.playbooks.size;
  }

  getRehearsedCount(maxAgeDays = 30): number {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    return this.getAll().filter((p) => p.lastRehearsedAt && new Date(p.lastRehearsedAt).getTime() > cutoff).length;
  }
}
