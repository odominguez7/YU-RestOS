import time
import httpx
import os

GRANITE_URL = os.getenv("GRANITE_URL", "http://localhost:64896")
MODEL = "/models/granite-3.3-8b-instruct-Q4_K_M.gguf"
MODEL_DISPLAY = "Granite 3.3 (8B)"


async def generate_coaching_local(system_prompt: str, user_prompt: str) -> dict:
    """Generate coaching via local Granite 3.3 through llama.cpp OpenAI-compatible API."""
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GRANITE_URL}/v1/chat/completions",
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=120,
            )
            data = response.json()
            elapsed = time.time() - start

            content = data["choices"][0]["message"].get("content", "")
            # Granite 3.3 sometimes puts the answer in reasoning_content
            if not content:
                content = data["choices"][0]["message"].get("reasoning_content", "")

            return {
                "source": "local",
                "model": MODEL_DISPLAY,
                "response": content,
                "latency_ms": round(elapsed * 1000),
                "data_location": "on-device",
                "privacy": "No data sent to external servers",
            }
    except Exception as e:
        return {
            "source": "local",
            "model": MODEL_DISPLAY,
            "response": f"[Local AI unavailable: {str(e)}. Ensure Granite 3.3 container is running on port 64896.]",
            "latency_ms": 0,
            "data_location": "on-device",
            "privacy": "No data sent to external servers",
        }
