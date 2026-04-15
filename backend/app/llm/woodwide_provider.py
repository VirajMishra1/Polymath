import httpx
import json
from typing import Dict, Any, Optional
from app.config import get_settings
from app.llm.provider import BaseLLMProvider

settings = get_settings()

class WoodWideProvider(BaseLLMProvider):
    """
    WoodWide AI provider for numeric reasoning and analysis.
    API Key: WOODWIDE_API_KEY
    """
    def __init__(self):
        self.api_key = settings.WOODWIDE_API_KEY
        self.base_url = "https://api.woodwide.ai/v1"

    async def generate_json(self, prompt: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            return {"error": "WOODWIDE_API_KEY not configured"}
            
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/generate",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "prompt": prompt,
                        "response_format": "json",
                        "schema": schema
                    },
                    timeout=60.0
                )
                
                if resp.status_code == 200:
                    return resp.json()
                else:
                    return {
                        "error": f"WoodWide API error: {resp.status_code}",
                        "details": resp.text
                    }
            except Exception as e:
                return {"error": f"WoodWide request failed: {str(e)}"}
