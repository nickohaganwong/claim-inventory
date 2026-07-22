// netlify/functions/analyze.js
// Secure proxy: the browser never sees your Anthropic key.
// 1) Put this file at:  netlify/functions/analyze.js
// 2) In Netlify → Site settings → Environment variables, add:
//        ANTHROPIC_API_KEY = sk-ant-...
// 3) In the app's Setup, use "Proxy" mode with URL:  /.netlify/functions/analyze
//
// Netlify runs Node 18+, which has global fetch built in.

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: cors, body: "Method not allowed" };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: { message: "ANTHROPIC_API_KEY not set in Netlify environment variables." } }) };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: event.body, // forward the app's payload verbatim
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { ...cors, "content-type": "application/json" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: { message: "Proxy error: " + err.message } }),
    };
  }
};
