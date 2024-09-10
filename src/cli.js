#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

import { Sissi } from './sissi.js'
import { SissiConfig } from './sissi-config.js';

const args = new Set(process.argv);
const config = new SissiConfig();

for (const configFile of [
  '.sissi.js',
  '.sissi.config.js',
]) {
  if (existsSync(configFile)) {
    try {
      const module = await import(path.resolve(process.cwd(), configFile));
      if (typeof module.default === "function") {
        config.addPlugin(module.default);
      }
      break;
    } catch (err) {
      console.error('Error reading config: ', err);
      process.exit(1);
    }
  }
}

function help() {
  console.info(`Sissi - Simple Static Side Instrument 👸`);
  console.info();
  console.info('command line args:')
  console.info(`sissi build - build site`);
  console.info(`sissi watch - watch mode`);
  console.info(`sissi dev - dev server mode`);
  console.info(`sissi version - version information`);
}

async function run() {
  const sissi = new Sissi(config);
  try {
    if (args.has('watch')) {
      await sissi.watch();
      return;
    }
    
    if (args.has('serve')) {
      await sissi.serve();
      return;
    }
    
    if (args.has('build')) {
      await sissi.build();
      return;
    }
    help();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
