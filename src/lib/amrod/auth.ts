let cachedToken: string | null = null;
let cachedAt = 0;

const TOKEN_TTL_MS = 55 * 60 * 1000; // refresh a few minutes before the 1hr expiry

export async function getAmrodToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const res = await fetch(`${process.env.AMROD_IDENTITY_URL}/VendorLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      UserName: process.env.AMROD_USERNAME,
      Password: process.env.AMROD_PASSWORD,
      CustomerCode: process.env.AMROD_CUSTOMER_CODE,
    }),
  });

  if (!res.ok) {
    throw new Error(`Amrod auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const token = data.token ?? data.Token ?? data.access_token;

  if (!token) {
    throw new Error(`Amrod auth response missing token: ${JSON.stringify(data)}`);
  }

  cachedToken = token;
  cachedAt = Date.now();
  return token;
}

export async function amrodFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = await getAmrodToken();

  const res = await fetch(`${process.env.AMROD_API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && retry) {
    await getAmrodToken(true);
    return amrodFetch(path, init, false);
  }

  return res;
}
