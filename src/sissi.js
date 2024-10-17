import { existsSync } from 'node:fs';
import { mkdir, watch, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { SissiConfig } from './sissi-config.js';
import { serve } from './httpd.js';
import EventEmitter from 'node:stream';
import { readDataDir } from './data.js';
import { handleTemplateFile } from './transforms/template-data.js';
import { getDependencyMap, walkDependencyMap } from './dependency-graph.js';
import { resolve } from './resolver.js';

export class Sissi {
  
  constructor(config = null) {
    this.config = config || new SissiConfig();
    this.dryMode = false;
    this.data = null;
  }

  /**
   * run a build 
   */
  async build(filter = null, eventEmitter) {
    if (! this.data) {
      this.data = await readDataDir(this.config);
    }
    const files = (filter instanceof Array) ? filter : 
      (await readdir(path.normalize(this.config.dir.input), {recursive: true})).filter(
      (file) => {
        if (! filter) return true;
        if (filter instanceof RegExp) return filter.test(file);
      }
    );
    const writtenFiles = [];
    for (const file of files) {
      writtenFiles.push(await this.processFile(file, eventEmitter));
    }
    return writtenFiles.filter(Boolean);
  }

  /**
   * watch
   * @param {EventEmitter} eventEmitter emitter for change events
   */
  async watch(eventEmitter = null, watchOptions = null, ignoreList = []) {
    if (! this.data) {
      this.data = await readDataDir(this.config);
    }
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
        lastExec.set(event.filename, performance.now());
        console.log(`[${event.eventType}] ${event.filename}`);
        const deps = await getDependencyMap(
          this.config.dir.input,
          await readdir(path.normalize(this.config.dir.input), {recursive: true}),
          this.config.resolve || resolve
        );
        const allDependants = walkDependencyMap(deps, event.filename);
        await this.build([event.filename, ...allDependants], eventEmitter);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      throw err;
    }
  }

  async processFile(inputFileName, eventEmitter) {
    if (! this.data) {
      this.data = await readDataDir(this.config);
    }
    if (inputFileName.startsWith('_') || inputFileName.includes(path.sep + '_') || path.parse(inputFileName).name.startsWith('_')) {
      return;
    }

    const tpl = await handleTemplateFile(this.config, this.data, inputFileName);
    if (! tpl) {
      return null;
    }
    
    console.log(`[write]\t${tpl.filename}`);
    if (eventEmitter) {
      eventEmitter.emit('watch-event', {
        eventType: 'change',
        filename: tpl.filename,
        page: tpl.page
      });
    }
    if (! this.dryMode) {
      await mkdir(path.parse(tpl.filename).dir, {recursive: true});
      await writeFile(tpl.filename, tpl.content, {});
    }
    return tpl.filename;
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
