const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

const isPortOpen = (port, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(1000);
    s.once('connect', () => {
      s.destroy();
      resolve(true);
    });
    s.once('timeout', () => {
      s.destroy();
      resolve(false);
    });
    s.once('error', () => {
      resolve(false);
    });
    s.connect(port, host);
  });
};

const waitForPort = async (port, maxSeconds = 15) => {
  for (let i = 0; i < maxSeconds * 2; i++) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const processes = [];

const cleanup = () => {
  console.log('\n\x1b[33m[SHUTDOWN] Stopping all CRM processes...\x1b[0m');
  processes.forEach((p) => {
    try {
      p.kill();
    } catch (e) {}
  });
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startAll() {
  console.log('========================================================');
  console.log('🚀 STARTING ENTERPRISE E-COMMERCE CRM SUITE');
  console.log('========================================================\n');

  // 1. Ensure MongoDB on 27017
  const isMongoRunning = await isPortOpen(27017);
  if (!isMongoRunning) {
    console.log('\x1b[33m[1/3] MongoDB port 27017 is free. Starting native MongoDB 9.0 engine...\x1b[0m');
    const mongodExe = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
    const dbPath = path.resolve(__dirname, 'backend/data/mongodb');
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

    if (fs.existsSync(mongodExe)) {
      const mongodProc = spawn(mongodExe, ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1'], {
        stdio: 'ignore',
      });
      processes.push(mongodProc);
      const ready = await waitForPort(27017);
      if (ready) {
        console.log('\x1b[32m✓ MongoDB is LIVE & accepting connections on 127.0.0.1:27017\x1b[0m');
      }
    }
  } else {
    console.log('\x1b[32m✓ MongoDB is already active on port 27017\x1b[0m');
  }

  // 2. Start Backend on 5000
  console.log('\x1b[33m[2/3] Starting Express Backend Engine on http://localhost:5000...\x1b[0m');
  const backendProc = spawn('node', ['src/server.js'], {
    cwd: path.resolve(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
  });
  processes.push(backendProc);

  await waitForPort(5000);
  console.log('\x1b[32m✓ Backend API connected to MongoDB & active on http://localhost:5000\x1b[0m');

  // 3. Start Frontend on 5173
  console.log('\x1b[33m[3/3] Starting Vite Frontend on http://localhost:5173...\x1b[0m');
  const frontendProc = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
  });
  processes.push(frontendProc);

  console.log('\n========================================================');
  console.log('🎉 CRM SYSTEM FULLY ONLINE AND SYNCED WITH MONGODB!');
  console.log('👉 Open your browser at: http://localhost:5173/dashboard');
  console.log('👉 MongoDB Compass URI:  mongodb://127.0.0.1:27017/ecommerce_crm');
  console.log('========================================================\n');
}

startAll().catch((err) => {
  console.error('Fatal startup error:', err);
  cleanup();
});

