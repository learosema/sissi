import { existsSync } from 'node:fs';
import { mkdir, watch, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { SissiConfig } from './sissi-config.js';
import { serve } from './httpd.js';
import EventEmitter from 'node:stream';

export class Sissi {
  
  constructor(config = null) {
    this.config = config || new SissiConfig();
    this.dryMode = false;    
  }

  /**
   * run a build 
   */
  async build() {
    const files = await readdir(path.normalize(this.config.dir.input), {recursive: true});
    for (const file of files) {
      await this.processFile(file);
    }
  }

  /**
   * watch
   * @param {EventEmitter} eventEmitter emitter for change events
   */
  async watch(eventEmitter = null, watchOptions = null, ignoreList = []) {
    await this.build();
    const lastExec = new Map();
    const options = { recursive: true };
    if (watchOptions) {
      Object.assign(options, watchOptions);
    }
    const inputDir = path.normalize(this.config.dir.input);
    const ignores = [
      path.normalize(this.config.dir.output), 
      '.git', 
      ...ignoreList
    ];
    if (! existsSync(inputDir)) {
      throw new Error(`Input directory Not found: ${this.config.dir.input}`);
    }
    console.info(`[watch]\tSissi is watching ${this.config.dir.input}`);
    try {
      const watcher = watch(this.config.dir.input, options);
      for await (const event of watcher) {
        if (lastExec.has(event.filename)) {
          const delta = performance.now() - lastExec.get(event.filename);
          if (delta < this.config.watchFileDelta) {
            continue;
          }
        }
        const info = path.parse(event.filename);
        if (ignores.find(d => info.dir.startsWith(path.normalize(d)))) {
          continue;
        }
        console.log(`[${event.eventType}] ${event.filename}`);
        if (eventEmitter) {
          eventEmitter.emit('watch-event', event);
        }
        await this.processFile(event.filename);
        lastExec.set(event.filename, performance.now());
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      throw err;
    }
  }

  async processFile(inputFileName) {

    const absInputFileName = path.resolve(this.config.dir.input, inputFileName);
    if (inputFileName.startsWith('_') || inputFileName.includes(path.sep + '_')) {
      return;
    }
    const stats = await stat(absInputFileName);
    if (stats.isDirectory()) {
      return;
    }
    let content = await readFile(absInputFileName, 'utf8');
    const parsed = path.parse(inputFileName);
    const extension = parsed.ext?.slice(1);

    let ext = null;
    if (this.config.extensions.has(extension)) {
      ext = this.config.extensions.get(extension);
      const processor = await ext.compile(content, inputFileName);
      content = await processor();
    }

    let outputFileName =this.config.naming(this.config.dir.output, inputFileName, ext?.outputFileExtension);
    console.log(`[write]\t${outputFileName}`);
    if (this.dryMode) {
      return;
    }
    await mkdir(path.parse(outputFileName).dir, {recursive: true});
    await writeFile(outputFileName, content, {});
  }

  /**
   * watch files and run a dev server
   */
  async serve() {
    const eventEmitter = new EventEmitter();
    await this.build();
    serve(eventEmitter);
    this.watch(eventEmitter);
  }
}
