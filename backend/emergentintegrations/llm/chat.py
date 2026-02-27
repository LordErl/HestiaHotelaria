"""
Compatibility shim for emergentintegrations.llm.chat
Uses Google Gemini API directly via google-genai SDK
"""
import google.generativeai as genai
import asyncio
from dataclasses import dataclass
from typing import Optional


@dataclass
class UserMessage:
    text: str


class LlmChat:
    def __init__(self, api_key: str, session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model_name = "gemini-2.0-flash"
        
    def with_model(self, provider: str, model: str) -> "LlmChat":
        # Map model names
        model_map = {
            "gemini-3-flash-preview": "gemini-2.0-flash",
            "gemini-2.0-flash": "gemini-2.0-flash",
            "gemini-1.5-flash": "gemini-1.5-flash",
        }
        self.model_name = model_map.get(model, "gemini-2.0-flash")
        return self
    
    async def send_message(self, message: UserMessage) -> str:
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=self.system_message
        )
        
        # Run synchronous API in thread to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(message.text)
        )
        
        return response.text
