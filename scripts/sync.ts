import { runSync } from '../lib/sync';

const force = process.argv.includes('--force');
const loopIdx = process.argv.indexOf('--loop');
const hours = loopIdx > 0 ? parseFloat(process.argv[loopIdx + 1] || '6') : 0;

async function once() {
  const r = await runSync({ force });
  console.log(
    '[' + new Date().toISOString().slice(0, 19) + '] fetched=' + r.fetched + ' added=' + r.added +
    ' actionable=' + r.actionable + ' errors=' + r.errors.length
  );
  for (const e of r.errors) console.log('  ! ' + e.source + ': ' + e.message.slice(0, 160));
  console.log('  digest -> ' + r.digestPath);
}

async function main() {
  if (hours > 0) {
    console.log('loop every ' + hours + 'h');
    for (;;) {
      await once();
      await new Promise((r) => setTimeout(r, hours * 3600 * 1000));
    }
  }
  await once();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
