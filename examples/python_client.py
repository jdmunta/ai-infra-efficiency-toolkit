"""
Point the OpenAI SDK at the local proxy via OPENAI_BASE_URL.
No code changes needed in existing apps — just set the env var before running.

    export OPENAI_BASE_URL=http://localhost:8000
    export OPENAI_API_KEY=sk-...
    python examples/python_client.py
"""

from openai import OpenAI

client = OpenAI()  # reads OPENAI_BASE_URL and OPENAI_API_KEY from environment

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello! What is 2+2?"}],
    extra_headers={"x-team": "demo"},
)

print(response.choices[0].message.content)
