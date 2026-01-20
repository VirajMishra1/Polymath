import httpx
from app.config import get_settings
from typing import Optional

settings = get_settings()

class TokenCompanyClient:
    """
    Client for The Token Company API.
    Used to compress text before sending to LLMs to save tokens and costs.
    """
    def __init__(self):
        self.api_key = settings.TOKEN_COMPANY_API_KEY
        self.base_url = "https://api.thetokencompany.com/v1" # Assumed base URL

    async def compress(self, text: str, target_tokens: Optional[int] = None) -> str:
        if not self.api_key:
            # Fallback to returning raw text if no API key
            return text
            
        async with httpx.AsyncClient() as client:
            try:
                # This is an assumed endpoint based on common patterns
                resp = await client.post(
                    f"{self.base_url}/compress",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "text": text,
                        "target_tokens": target_tokens
                    },
                    timeout=30.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("compressed_text", text)
                else:
                    print(f"Token Company API error: {resp.status_code} {resp.text}")
                    return text
            except Exception as e:
                print(f"Token Company error: {str(e)}")
                return text
