const SYNTAXES = {
  html: /<html-include[\s\r\n]*src="([\w\-\.]+)"[\s\r\n]*\/?>/g,
  css: /@import [\"\']([\w:\/\\]+\.css)[\"\'](?: layer\((\w+)\))?;/g,
};

/**
 * Bundle assets into one file.
 * 
 * @param {string} inputContent
 * @param {(resource: string) => Promise<string>} resolve 
 * @param {'html'|'css'} syntax 
 * @returns {Promise<string>} return the bundled resource
 */
async function bundle(inputContent, resolve, syntax, processor) {
  const includes = new Map();
  let content = inputContent, matches;
  const includePattern = SYNTAXES[syntax];

  while ((matches = Array.from(content.matchAll(includePattern))).length > 0) {
    for (const [, file] of matches) {
      
      const fullPath = path.join(config.dir.input, config.dir.includes, file);
      try {
        const content = await resolve(fullPath);
        
        includes.set(file, await (await processor(content, file)).compile(data));
      } catch (err) {
        console.error('error processing file:', fullPath, err);
        // silently fail if there is no include
        includes.set(file, `<!-- html-include src="${file}" -->`);
      }
    }
    content = content.replace(includePattern, (_, file) => {
      return includes.get(file);
    });
  }
}
