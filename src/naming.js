import path from 'node:path'

export function directoryNaming(dir, inputFileName, outputFileExtension = null) {
  const parsed = path.parse(inputFileName);
  if (/\.html?$/.test(inputFileName) && parsed.name !== 'index') {
    return path.join(path.normalize(dir), parsed.name, 'index.html');
  }
  return path.join(path.normalize(dir), 
    outputFileExtension ? 
    inputFileName.replace(/\.\w+$/, ('.' + outputFileExtension).replace(/\.+/, '.')) : inputFileName
  );
}

export function defaultNaming(dir, inputFileName, outputFileExtension = null) {
  return path.join(path.normalize(dir), 
    outputFileExtension ? 
    inputFileName.replace(/\.\w+$/, ('.' + outputFileExtension).replace(/\.+/, '.')) : inputFileName
  );
}
