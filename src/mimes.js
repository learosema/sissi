export function getMime(path) {
  if (/\.html?$/.test(path)) return 'text/html';
  if (/\.css$/.test(path)) return 'text/css';
  if (/\.gif$/.test(path)) return 'image/gif';
  if (/\.png$/.test(path)) return 'image/png';
  if (/\.webp$/.test(path)) return 'image/webp';
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  if (/\.svg$/.test(path)) return 'image/svg+xml';
  if (/\.xml$/.test(path)) return 'text/xml';
  if (/\.js$/.test(path)) return 'text/javascript';
  if (/\.json$/.test(path)) return 'application/json';
  if (/\.midi?$/.test(path)) return 'audio/midi';
  if (/\.ico$/.test(path)) return 'image/vnd.microsoft.icon';
  if (/\.txt$/.test(path)) return 'text/plain';
  if (/\.md$/.test(path)) return 'text/plain';
  return 'application/octet-stream';
}
