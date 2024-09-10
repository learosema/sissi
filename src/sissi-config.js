export class SissiConfig {
  
  dir = {
    output: 'public',
    includes: '_includes',
    input: '.',
  };

  watchFileDelta = 500;

  extensions = new Map();
  filters = new Map();

  constructor(options = null) {
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

  addFilter(filter, filterFunction) {
    this.filters.add(filter, filterFunction);
  }

  addTemplateFormats(...formats) {
    // nop.
  }
}
