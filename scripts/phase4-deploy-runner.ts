import fs from 'fs';
import path from 'path';
import { SQLiteConnection } from '../src/infrastructure/database/sqlite-connection';

async function runPhase4DeploymentVerification() {
  console.log('🚀 Starting Phase 4 Deployment Readiness & Infrastructure Verification...\n');

  const rootDir = path.join(__dirname, '..');

  // --------------------------------------------------------------------------
  // VERIFICATION 1: Production TypeScript Build Output (`dist/`)
  // --------------------------------------------------------------------------
  console.log('--- VERIFICATION 1: Production Build Artifacts ---');
  const distPath = path.join(rootDir, 'dist');
  const mainDistFile = path.join(distPath, 'index.js');

  if (!fs.existsSync(distPath) || !fs.existsSync(mainDistFile)) {
    throw new Error('VERIFICATION 1 FAILED: Production build folder `dist/` or `dist/index.js` missing.');
  }
  console.log('✅ VERIFICATION 1 PASSED: Compiled `dist/index.js` production entrypoint verified!\n');

  // --------------------------------------------------------------------------
  // VERIFICATION 2: Dockerfile & .dockerignore Configuration
  // --------------------------------------------------------------------------
  console.log('--- VERIFICATION 2: Container Security & Multi-Stage Dockerfile ---');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerignorePath = path.join(rootDir, '.dockerignore');

  if (!fs.existsSync(dockerfilePath)) {
    throw new Error('VERIFICATION 2 FAILED: `Dockerfile` missing.');
  }

  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  if (!dockerfileContent.includes('FROM node:20-alpine AS builder') || !dockerfileContent.includes('USER zumra')) {
    throw new Error('VERIFICATION 2 FAILED: Dockerfile missing multi-stage build or non-root user setup.');
  }

  if (!fs.existsSync(dockerignorePath)) {
    throw new Error('VERIFICATION 2 FAILED: `.dockerignore` missing.');
  }
  console.log('✅ VERIFICATION 2 PASSED: Multi-stage non-root Dockerfile & .dockerignore verified!\n');

  // --------------------------------------------------------------------------
  // VERIFICATION 3: Multi-Container Composition (`docker-compose.yml`)
  // --------------------------------------------------------------------------
  console.log('--- VERIFICATION 3: Docker Compose Services & Health Checks ---');
  const composePath = path.join(rootDir, 'docker-compose.yml');

  if (!fs.existsSync(composePath)) {
    throw new Error('VERIFICATION 3 FAILED: `docker-compose.yml` missing.');
  }

  const composeContent = fs.readFileSync(composePath, 'utf8');
  if (
    !composeContent.includes('zumra-app:') ||
    !composeContent.includes('zumra-redis:') ||
    !composeContent.includes('zumra-mssql:') ||
    !composeContent.includes('healthcheck:')
  ) {
    throw new Error('VERIFICATION 3 FAILED: docker-compose.yml missing App, Redis, SQL Server, or healthchecks.');
  }
  console.log('✅ VERIFICATION 3 PASSED: Docker Compose multi-container composition verified!\n');

  // --------------------------------------------------------------------------
  // VERIFICATION 4: PM2 Ecosystem Cluster Configuration
  // --------------------------------------------------------------------------
  console.log('--- VERIFICATION 4: PM2 Ecosystem Cluster Configuration ---');
  const ecosystemPath = path.join(rootDir, 'ecosystem.config.js');

  if (!fs.existsSync(ecosystemPath)) {
    throw new Error('VERIFICATION 4 FAILED: `ecosystem.config.js` missing.');
  }

  const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
  if (!ecosystemContent.includes("exec_mode: 'cluster'") || !ecosystemContent.includes("max_memory_restart: '500M'")) {
    throw new Error('VERIFICATION 4 FAILED: ecosystem.config.js missing cluster mode or 500M memory limit.');
  }
  console.log('✅ VERIFICATION 4 PASSED: PM2 Ecosystem cluster configuration verified!\n');

  // --------------------------------------------------------------------------
  // VERIFICATION 5: Database Connection Probe
  // --------------------------------------------------------------------------
  console.log('--- VERIFICATION 5: Production SQLite Database Health Probe ---');
  const db = SQLiteConnection.getDatabase();
  if (!db) {
    throw new Error('VERIFICATION 5 FAILED: Database connection probe failed.');
  }
  await SQLiteConnection.close();
  console.log('✅ VERIFICATION 5 PASSED: Production SQLite Database probe active!\n');

  console.log('🎉 ALL PHASE 4 DEPLOYMENT VERIFICATIONS PASSED 100%! SYSTEM READY FOR DOCKER & PM2 DEPLOYMENT!');
}

runPhase4DeploymentVerification().catch((err) => {
  console.error('❌ Phase 4 Deployment Verification Failed:', err);
  process.exit(1);
});
