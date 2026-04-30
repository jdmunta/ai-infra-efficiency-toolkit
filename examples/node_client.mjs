/**
 * Point the OpenAI SDK at the local proxy via OPENAI_BASE_URL.
 * No code changes needed in existing apps — just set the env var before running.
 *
 *   export OPENAI_BASE_URL=http://localhost:8000
 *   export OPENAI_API_KEY=sk-...
 *   node examples/node_client.mjs
 */

import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_BASE_URL and OPENAI_API_KEY from environment

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello! What is 2+2?" }],
  headers: { "x-team": "demo" },
});

console.log(response.choices[0].message.content);
