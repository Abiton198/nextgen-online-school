export async function handler() {
  try {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Google Maps API key not configured" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // don't let proxies cache the key
      },
      body: JSON.stringify({ key }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected server error" }),
    };
  }
}
