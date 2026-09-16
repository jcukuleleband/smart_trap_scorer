export function resolveApiBase(value, pageURL) {
  if (!value) throw new Error('Backend not configured. Set the PWA_API_BASE_URL repository variable and redeploy.');
  const url = new URL(value, pageURL);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new Error('Backend URL must use HTTPS (HTTP is allowed only for localhost), without credentials, query or fragment.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}
export function endpoint(base, path) { return new URL(path.replace(/^\/+/, ''), base).href; }
