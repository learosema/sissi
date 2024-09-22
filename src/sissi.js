import { existsSync } from 'node:fs';
import { mkdir, watch, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { SissiConfig } from './sissi-config.js';
import { serve } from './httpd.js';
import EventEmitter from 'node:stream';
import { readDataDir } from './data.js';
import { template } from './transforms/template-data.js'
import { frontmatter } from './transforms/frontmatter.js';

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
    const files = (await readdir(path.normalize(this.config.dir.input), {recursive: true})).filter(
      (file) => {
        if (! filter) return true;
        if (filter instanceof RegExp) return filter.test(file);
      }
    );
    for (const file of files) {
      await this.processFile(file, eventEmitter);
    }
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
        const isIgnoredFile = (info.name.startsWith('_') && info.dir.includes(path.sep + '_')); 
        if (isIgnoredFile && info.ext === '.css') {
          await this.build(/.css$/, eventEmitter);
          continue;
        }
        if (isIgnoredFile && info.ext === '.html') {
          await this.build(/.html$/, eventEmitter);
          continue;
        }
        await this.processFile(event.filename, eventEmitter);
        
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
      const { data: matterData, body } = frontmatter(content);
      const fileData = Object.assign({}, structuredClone(this.data), matterData);
      const processor = await ext.compile(body, inputFileName);
      content = template(await processor(fileData))(fileData);
      if (fileData.layout) {
        const relLayoutDir = path.normalize(
          path.join(this.config.dir.input, this.config.dir.layouts || '_layouts')
        );
        const absLayoutFilePath = path.resolve(relLayoutDir, fileData.layout);
        const layoutContent = await readFile(absLayoutFilePath, 'utf8');
        fileData.content = content;
        content = template(layoutContent)(fileData);
      }
    }

    let outputFileName =this.config.naming(this.config.dir.output, inputFileName, ext?.outputFileExtension);
    console.log(`[write]\t${outputFileName}`);
    if (eventEmitter) {
      eventEmitter.emit('watch-event', {
        eventType: 'change',
        filename: inputFileName
      });
    }
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
