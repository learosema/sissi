import path from 'node:path'

export function directoryNaming(inputFileName, outputFileExtension = null) {
  const parsed = path.parse(inputFileName);
  if (/\.html?$/.test(inputFileName) && parsed.name !== 'index') {
    return path.join('/', parsed.name, 'index.html');
  }
  return path.join('/', outputFileExtension ? 
    inputFileName.replace(/\.\w+$/, ('.' + outputFileExtension).replace(/\.+/, '.')) : inputFileName
  );
}

export function defaultNaming(inputFileName, outputFileExtension = null) {
  return path.join('/', outputFileExtension ? 
    inputFileName.replace(/\.\w+$/, ('.' + outputFileExtension).replace(/\.+/, '.')) : inputFileName)
  ;
}
