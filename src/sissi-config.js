import css from "./css.js";
import html from "./html.js";
import { defaultNaming } from "./naming.js";

export class SissiConfig {
  
  dir = {
    output: 'public',
    includes: '_includes',
    layouts: '_layouts',
    data: '_data',
    input: '.',
  };

  watchFileDelta = 1000;
  naming = defaultNaming;

  templateFormats = new Map();
  extensions = new Map();
  filters = new Map();

  constructor(options = null) {
    this.addPlugin(html);
    this.addPlugin(css);
    this.applyConfig(options);
  }

  addPlugin(plugin) {
    const result = plugin(this);
    this.applyConfig(result);
  }

  applyConfig(options) {
    if (options && options.dir) {
      Object.assign(this.dir, options?.dir);
    }
  }

  /**
   * add an extension to Sissi
   * 
   * @param {string} extension 
   * @param {function} processingFunction 
   */
  addExtension(extension, processingFunction) {
    this.extensions.set(extension, processingFunction);
  }

  /**
   * Add a filter
   * @param {string} filter 
   * @param {function} filterFunction 
   */
  addFilter(filter, filterFunction) {
    this.filters.add(filter, filterFunction);
  }

  /**
   * Add extensions as a valid template language to process
   * @param  {...string} formats 
   */
  addTemplateFormats(...formats) {
    for (const format of formats) {
      this.templateFormats.set(format);
    }
  }
}
