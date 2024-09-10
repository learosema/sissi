import { existsSync } from 'node:fs';
import { mkdir, watch, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { SissiConfig } from './sissi-config.js';

export class Sissi {

  
  constructor(config = null) {
    this.config = config || new SissiConfig();
  }

  /**
   * run a build 
   */
  async build() {
    const files = await readdir(path.normalize(this.config.dir.input), {recursive: true});
    for (const file of files) {
      const includePath = path.join(
        path.normalize(this.config.dir.input),
        path.normalize(this.config.dir.includes)
      );
      const info = path.parse(file);
      if (info.dir.startsWith(includePath) || info.base.startsWith('_')) {
        continue;
      }
      await this.processFile(file);
    }
  }

  /**
   * watch
   */
  async watch(watchOptions = null, ignoreList = []) {
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
    console.info(`Sissi is watching ${this.config.dir.input}`);
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
        await this.processFile(event.filename);
        lastExec.set(event.filename, performance.now());
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      throw err;
    }
  }

  async processFile(filename) {
    console.log(`processing: ${filename}`);
    const inputFileName = path.resolve(
      path.normalize(this.config.dir.input), filename);
    let content = await readFile(inputFileName, 'utf8');
    let outputFileName = path.resolve(
      path.normalize(this.config.dir.output), 
      filename
    );

    const pattern = /\.(\w+)$/;
    const match = filename.match(pattern);
    const extension = match[1];
    if (this.config.extensions.has(extension)) {
      const ext = this.config.extensions.get(extension);
      if (ext.outputFileExtension) {
        outputFileName = outputFileName.replace(/\.\w+$/, '.' + ext.outputFileExtension);
      }
      const processor = await ext.compile(content, inputFileName);
      content = await processor();
    }
    await mkdir(path.parse(outputFileName).dir, {recursive: true});
    await writeFile(outputFileName, content, {});
  }

  /**
   * watch files and run a dev server
   */
  serve() {
    throw new Error('Still TODO :)')
  }
}