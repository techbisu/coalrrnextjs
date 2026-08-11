let cachedLocalIp: string | null = null;
let lastCacheTime = 0;

export async function getRealIp(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return null; // Client side fallback
  }

  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    let ipAddress = forwarded ? forwarded.split(',')[0].trim() : (h.get('x-real-ip') || null);

    // If local dev environment, x-forwarded-for won't have a real public IP.
    // Fetch it from the backend to bypass browser CORS/Adblock issues.
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
      if (cachedLocalIp && Date.now() - lastCacheTime < 3600000) {
        return cachedLocalIp; // Cache for 1 hour
      }

      const endpoints = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://jsonip.com'
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
          const res = await fetch(endpoint, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (data.ip) {
              cachedLocalIp = data.ip;
              lastCacheTime = Date.now();
              return data.ip;
            }
          }
        } catch (e) {
          // silently try next
        }
      }
      return '127.0.0.1'; // fallback if offline
    }

    return ipAddress;
  } catch (e) {
    return null;
  }
}
