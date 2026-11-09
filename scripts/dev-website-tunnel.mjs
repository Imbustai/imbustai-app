import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT ?? 4200);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') console.error(error.message);
    }
  }
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function start(command, args, capture = false) {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env, NX_DAEMON: 'false', NX_ISOLATE_PLUGINS: 'false' },
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${command} exited; stopping website and tunnel.`);
      stop(code || 1);
    }
  });
  return child;
}

try {
  start(process.execPath, [
    'node_modules/next/dist/bin/next', 'dev', 'apps/website',
    '--webpack', '--port', String(port),
  ]);
  const deadline = Date.now() + 120_000;
  let ready = false;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      ready = response.ok && (await response.json()).ok === true;
      if (ready) break;
    } catch { /* The development server is still starting. */ }
    await delay(1000);
  }
  if (!stopping && !ready) throw new Error('Website did not become ready within two minutes.');
  if (!stopping) {
    const tunnel = start('npm', [
      'exec', '--yes', '--package=localtunnel@2.0.2', '--',
      'lt', '--port', String(port), '--local-host', 'localhost',
    ], true);
    let output = '';
    let announced = false;
    tunnel.stdout.on('data', async (chunk) => {
      process.stdout.write(chunk);
      output = (output + chunk).slice(-4096);
      const url = output.match(/your url is: (https:\/\/\S+)/)?.[1];
      if (!url || announced) return;
      announced = true;
      console.log(`\nPublic website: ${url}\nYour stories and letters: ${url}/games`);
      try {
        const response = await fetch('https://loca.lt/mytunnelpassword', {
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        console.log(`LocalTunnel password (if prompted): ${(await response.text()).trim()}`);
      } catch {
        console.log('Retrieve the tunnel password on this machine: curl https://loca.lt/mytunnelpassword');
      }
      console.log('Keep this command running. Ctrl+C stops both the website and tunnel.');
    });
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
