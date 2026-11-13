const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mongodProcess = null;
let embeddedMongod = null;

/**
 * Checks if a TCP port is currently open and reachable
 */
const isPortInUse = (port = 27017, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
};

/**
 * Wait until port is ready (max 10 seconds)
 */
const waitForPort = async (port = 27017, host = '127.0.0.1', maxRetries = 20) => {
  for (let i = 0; i < maxRetries; i++) {
    const ready = await isPortInUse(port, host);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

/**
 * Find installed mongod.exe on the system
 */
const findInstalledMongod = () => {
  const commonPaths = [
    'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
};

/**
 * Ensure MongoDB is available on localhost:27017.
 * 1. Checks if already running.
 * 2. If not, auto-spawns native installed MongoDB.
 * 3. Gracefully falls back to mongodb-memory-server if present.
 */
const ensureLocalMongo = async () => {
  const port = 27017;
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.log(`\x1b[32m[DATABASE] Detected active MongoDB server on port ${port}\x1b[0m`);
    return 'mongodb://127.0.0.1:27017/ecommerce_crm';
  }

  console.log(`\x1b[33m[DATABASE] Port ${port} is free. Auto-launching local MongoDB engine...\x1b[0m`);
  const dbPath = path.resolve(__dirname, '../../data/mongodb');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  // 1. Try launching installed native MongoDB binary
  const mongodExe = findInstalledMongod();
  if (mongodExe) {
    console.log(`\x1b[36m[DATABASE] Found native MongoDB binary at: ${mongodExe}\x1b[0m`);
    try {
      mongodProcess = spawn(
        mongodExe,
        ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'],
        {
          detached: false,
          stdio: 'ignore',
        }
      );

      mongodProcess.on('error', (err) => {
        console.warn(`[DATABASE] Native mongod spawn warning: ${err.message}`);
      });

      const ready = await waitForPort(port);
      if (ready) {
        console.log(`\x1b[32m[DATABASE] Local MongoDB Community Server running on 127.0.0.1:${port}\x1b[0m`);
        return 'mongodb://127.0.0.1:27017/ecommerce_crm';
      }
    } catch (spawnErr) {
      console.warn(`[DATABASE] Native launch attempted with notice: ${spawnErr.message}`);
    }
  }

  // 2. Try mongodb-memory-server if available
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    embeddedMongod = await MongoMemoryServer.create({
      instance: {
        port,
        dbPath,
        dbName: 'ecommerce_crm',
      },
    });
    const uri = embeddedMongod.getUri();
    console.log(`\x1b[32m[DATABASE] Memory MongoDB active at: ${uri}\x1b[0m`);
    return uri;
  } catch (memErr) {
    // Memory server not installed, use standard URI
  }

  return 'mongodb://127.0.0.1:27017/ecommerce_crm';
};

const stopLocalMongo = async () => {
  if (mongodProcess) {
    try {
      mongodProcess.kill();
    } catch (e) {}
  }
  if (embeddedMongod) {
    await embeddedMongod.stop();
  }
};

module.exports = { ensureLocalMongo, stopLocalMongo, isPortInUse };
