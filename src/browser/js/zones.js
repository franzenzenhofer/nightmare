// Security zone classification — pure function, no DOM deps
// Depends on: API_PORT (global)

function classifyZone(url) {
  var proxyPrefix = 'http://127.0.0.1:' + API_PORT + '/proxy/';
  if (url.startsWith(proxyPrefix)) return 'WEB';
  try {
    var parsed = new URL(url);
    if (parsed.protocol === 'file:') return 'LOCAL';
    if (parsed.protocol === 'nightmare:') return 'LOCAL';
    var h = parsed.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '0.0.0.0'
        || h.endsWith('.localhost')
        || /^192\.168\.\d+\.\d+$/.test(h)
        || /^10\.\d+\.\d+\.\d+$/.test(h)
        || /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h)) return 'LOCALHOST';
    return 'WEB';
  } catch (e) { return 'LOCAL'; }
}

var ZONE_COLORS = { LOCAL: '#4ade80', LOCALHOST: '#60a5fa', WEB: '#ff3333' };
var ZONE_CSS = { LOCAL: 'local', LOCALHOST: 'localhost', WEB: 'web' };
var ZONE_MSG = {
  LOCAL: 'LOCAL FILE  //  Node.js active  //  Full system access',
  LOCALHOST: 'LOCALHOST  //  Node.js active  //  Full system access',
  WEB: 'THIS WEBSITE HAS FULL NODE.JS ACCESS  //  require() fs process child_process  //  NO SANDBOX'
};
