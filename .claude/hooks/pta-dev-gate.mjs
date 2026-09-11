#!/usr/bin/env node
/**
 * PTA Dev session gate. Installed into each repo at .claude/hooks/pta-dev-gate.mjs
 * and wired via .claude/settings.json (see agent/install.mjs in the pta-dev repo).
 *
 *   session-start  SessionStart hook: check in on the ops board, print the brief.
 *                  If critical flags target this repo, arm the hard gate.
 *   pre-tool       PreToolUse hook on Write|Edit|MultiEdit|NotebookEdit: exit 2
 *                  (block) while the gate is armed and unacknowledged.
 *   ack            Acknowledge the critical flags; records who read them, unblocks.
 *   session-end    SessionEnd hook: mark the session ended (best effort).
 *
 * Config (each person sets these once in their Claude environment):
 *   PTA_DEV_URL        e.g. https://pta-dev.vercel.app
 *   PTA_DEV_AGENT_KEY  shared agent key (matches OPS_AGENT_KEY on the server)
 *   PTA_DEV_PERSON     darren | lloyd | gareth
 *
 * Posture: fail open on network/config problems (a broken ops board must never
 * stop work — you fall back to PTA-CONTEXT.md), fail closed only when the board
 * answered and said there are critical flags.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const TIMEOUT_MS = 4000;
const cmd = process.argv[2] ?? 'session-start';

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const repoRoot = git('rev-parse --show-toplevel') || process.cwd();
const stateFile = join(repoRoot, '.claude', '.pta-dev-session.json');

function repoName() {
  const remote = git('remote get-url origin');
  const m = remote.match(/[/:]([^/]+?)(?:\.git)?$/);
  return m ? m[1] : basename(repoRoot);
}

function readState() {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(state) {
  try {
    mkdirSync(dirname(stateFile), { recursive: true });
    writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch {
    /* state file is an optimisation; never fatal */
  }
}

async function api(path, body) {
  const url = process.env.PTA_DEV_URL.replace(/\/$/, '') + path;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.PTA_DEV_AGENT_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function configured() {
  return !!(process.env.PTA_DEV_URL && process.env.PTA_DEV_AGENT_KEY && process.env.PTA_DEV_PERSON);
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, info: 3 };

async function sessionStart() {
  if (!configured()) {
    console.log(
      '[pta-dev] Not configured (PTA_DEV_URL / PTA_DEV_AGENT_KEY / PTA_DEV_PERSON). ' +
        'No presence registered. FALLBACK: read PTA-CONTEXT.md section 1 before touching the shared database.'
    );
    return;
  }
  const repo = repoName();
  const branch = git('rev-parse --abbrev-ref HEAD') || null;
  let out;
  try {
    out = await api('/api/agent/checkin', {
      person: process.env.PTA_DEV_PERSON,
      repo,
      branch,
      kind: 'claude',
      label: process.env.CLAUDE_SESSION_ID ?? null,
    });
  } catch (err) {
    console.log(
      `[pta-dev] Board unreachable (${err.message}); working WITHOUT live warnings. ` +
        'FALLBACK: read PTA-CONTEXT.md section 1 before touching the shared database.'
    );
    return;
  }

  writeState({
    sessionId: out.sessionId,
    ackRequired: !!out.ackRequired,
    acked: false,
    criticalIds: out.criticalIds ?? [],
    checkedInAt: new Date().toISOString(),
  });

  const lines = [];
  lines.push(`[pta-dev] Checked in: ${process.env.PTA_DEV_PERSON} @ ${repo}${branch ? ` (${branch})` : ''}. Session is on the Now board.`);
  if (out.othersActive?.length) {
    lines.push(
      `[pta-dev] ▲ HEADS UP: also active in ${repo} right now: ${out.othersActive.join(', ')}. Coordinate before overlapping work.`
    );
  }
  const flags = (out.flags ?? []).sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));
  if (flags.length === 0) {
    lines.push('[pta-dev] No active flags for this repo.');
  } else {
    lines.push(`[pta-dev] ${flags.length} active flag(s) relevant to this session:`);
    for (const f of flags) {
      lines.push(`  [${f.severity.toUpperCase()}] ${f.title}`);
      if (f.recommendation) lines.push(`    -> ${f.recommendation}`);
    }
  }
  if (out.ackRequired) {
    lines.push('');
    lines.push('[pta-dev] HARD GATE ARMED: this repo is covered by CRITICAL flag(s) above.');
    lines.push('[pta-dev] File edits (Write/Edit) are BLOCKED until you acknowledge you have read them:');
    lines.push('[pta-dev]     node .claude/hooks/pta-dev-gate.mjs ack');
    lines.push('[pta-dev] Acknowledging records your name and session on the ops board.');
  }
  console.log(lines.join('\n'));
}

function preTool() {
  const state = readState();
  // Fail open: no state means the board was unreachable or unconfigured.
  if (!state || !state.ackRequired || state.acked) return;
  console.error(
    '[pta-dev] BLOCKED by the ops gate: critical flag(s) cover this repo and this session has not acknowledged them. ' +
      'Re-read the [CRITICAL] flags from session start, then run: node .claude/hooks/pta-dev-gate.mjs ack — and only then edit files.'
  );
  process.exit(2);
}

async function ack() {
  const state = readState();
  if (!state?.sessionId) {
    console.log('[pta-dev] Nothing to acknowledge: no live session state (gate is not armed).');
    return;
  }
  if (!configured()) {
    console.log('[pta-dev] Not configured; clearing local gate only.');
    writeState({ ...state, acked: true });
    return;
  }
  try {
    await api('/api/agent/ack', { sessionId: state.sessionId, flagIds: state.criticalIds ?? [] });
    writeState({ ...state, acked: true });
    console.log(
      `[pta-dev] Acknowledged ${state.criticalIds?.length ?? 0} critical flag(s). Recorded on the board. Gate open — proceed, respecting the recommendations.`
    );
  } catch (err) {
    // The point of the ack is the audit trail; if the board is down, do not trap the session.
    writeState({ ...state, acked: true });
    console.log(`[pta-dev] Board unreachable (${err.message}); gate opened locally without recording. Mention this to the user.`);
  }
}

async function sessionEnd() {
  const state = readState();
  if (!state?.sessionId || !configured()) return;
  try {
    await api('/api/agent/checkout', { sessionId: state.sessionId });
  } catch {
    /* best effort */
  }
}

const run = { 'session-start': sessionStart, 'pre-tool': preTool, ack, 'session-end': sessionEnd }[cmd];
if (!run) {
  console.error(`[pta-dev] unknown command: ${cmd}`);
  process.exit(1);
}
await run();
