// Only link to HTTPS Indian government-operated domains for scheme sources.
export function officialUrl(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !(['gov.in','nic.in'].some(domain => host === domain || host.endsWith('.'+domain)))) return null;
    return u.href;
  } catch { return null; }
}
