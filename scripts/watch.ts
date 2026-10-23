import fs from 'node:fs';
import path from 'node:path';
import { runSync } from '../lib/sync';

const INTERVAL = Number(process.env.WATCH_MS || 600000); // 默认 600 秒
const OUT = path.join(process.cwd(), 'data', 'watch.json');
let runs = 0;
let stopped = false;

function writeState(patch: Record<string, unknown>) {
  let prev: Record<string, unknown> = {};
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ...prev, ...patch, intervalMs: INTERVAL }, null, 2));
}

async function tick() {
  const startedAt = new Date().toISOString();
  try {
    writeState({ running: true, startedAt });
    const r = await runSync();
    runs += 1;
    writeState({
      running: false,
      lastRunAt: r.finishedAt,
      lastAdded: r.added,
      lastFetched: r.fetched,
      lastActionable: r.actionable,
      lastErrors: r.errors,
      runs,
      nextRunAt: new Date(Date.now() + INTERVAL).toISOString(),
    });
    console.log(
      '[' + new Date().toISOString().slice(11, 19) + '] sync ok fetched=' + r.fetched +
      ' added=' + r.added + ' actionable=' + r.actionable + ' errors=' + r.errors.length
    );
  } catch (e: any) {
    writeState({ running: false, lastError: String(e?.message || e), nextRunAt: new Date(Date.now() + INTERVAL).toISOString() });
    console.error('[watch] sync failed:', String(e?.message || e));
  }
}

async function main() {
  console.log('[watch] interval = ' + INTERVAL + 'ms (' + INTERVAL / 1000 + 's), pid ' + process.pid);
  await tick();
  const timer = setInterval(() => {
    if (!stopped) tick();
  }, INTERVAL);

  const stop = () => {
    stopped = true;
    clearInterval(timer);
    writeState({ running: false, stoppedAt: new Date().toISOString() });
    console.log('[watch] stopped');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();
