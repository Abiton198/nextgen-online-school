export async function handler(event) {
  try {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY;
    const allowedOrigins = [
      "http://localhost:5173",
      "https://nextgenonlineschool.netlify.app",
      "https://www.nextgenonlineschool.netlify.app",
      "https://school.nextgenskills.co.za/",
    ];

    const origin =
      event.headers.origin || event.headers.referer || "unknown";

    // 🔐 Simple check
    const isAllowed = allowedOrigins.some((allowed) =>
      origin.startsWith(allowed)
    );

    if (!isAllowed) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Unauthorized request origin" }),
      };
    }

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
        "Cache-Control": "no-store", // don't cache the key
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
