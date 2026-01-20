import google.generativeai as genai
import json
from typing import Dict, Any, Optional
from app.config import get_settings
from app.llm.provider import BaseLLMProvider

settings = get_settings()

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash') # Using flash for speed

    async def generate_json(self, prompt: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # For structured output, we can use response_mime_type="application/json"
        # and include the schema in the prompt or use the response_schema parameter (if supported)
        
        generation_config = {
            "temperature": 0.1,
            "response_mime_type": "application/json",
        }
        
        # In a real app, we'd use asyncio.to_thread for the sync SDK
        import asyncio
        response = await asyncio.to_thread(
            self.model.generate_content,
            prompt,
            generation_config=generation_config
        )
        
        try:
            return json.loads(response.text)
        except Exception as e:
            print(f"Failed to parse Gemini JSON: {str(e)}")
            # Fallback or retry logic
            return {}
