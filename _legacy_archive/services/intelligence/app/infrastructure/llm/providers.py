"""
LLM Provider Adapters

Implements the ILLMClient port for different LLM providers.
Adding a new provider (e.g., Anthropic, Mistral) requires only
a new class implementing ILLMClient — no changes to use cases.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    text: str
    token_count: int
    model: str


class ILLMClient(ABC):
    """Port interface for LLM providers."""

    @property
    @abstractmethod
    def model_name(self) -> str: ...

    @abstractmethod
    async def complete(self, prompt: str, max_tokens: int = 2048) -> LLMResponse: ...


class OllamaClient(ILLMClient):
    """
    Adapter for Ollama local LLM server.
    Self-hostable, open-source — the default for UrbanCore.
    """

    def __init__(self, base_url: str, model: str) -> None:
        self._base_url = base_url
        self._model = model
        self._client = httpx.AsyncClient(timeout=120.0)  # LLM can be slow

    @property
    def model_name(self) -> str:
        return self._model

    async def complete(self, prompt: str, max_tokens: int = 2048) -> LLMResponse:
        response = await self._client.post(
            f"{self._base_url}/api/generate",
            json={
                "model": self._model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
        )
        response.raise_for_status()
        data = response.json()

        return LLMResponse(
            text=data.get("response", ""),
            token_count=data.get("eval_count", 0) + data.get("prompt_eval_count", 0),
            model=self._model,
        )


class OpenAIClient(ILLMClient):
    """
    Adapter for OpenAI API (GPT-4o, GPT-4o-mini).
    Used when cloud LLM is preferred for quality.
    """

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model
        self._client = httpx.AsyncClient(
            base_url="https://api.openai.com/v1",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0,
        )

    @property
    def model_name(self) -> str:
        return self._model

    async def complete(self, prompt: str, max_tokens: int = 2048) -> LLMResponse:
        response = await self._client.post(
            "/chat/completions",
            json={
                "model": self._model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.3,  # Lower temperature for factual reports
            },
        )
        response.raise_for_status()
        data = response.json()

        choice = data["choices"][0]
        usage = data.get("usage", {})

        return LLMResponse(
            text=choice["message"]["content"],
            token_count=usage.get("total_tokens", 0),
            model=self._model,
        )


def create_llm_client(provider: str, config: object) -> ILLMClient:
    """
    Factory function — creates the appropriate LLM client based on config.
    This is the only place where the provider decision is made.
    """
    if provider == "ollama":
        return OllamaClient(
            base_url=getattr(config, "ollama_base_url"),
            model=getattr(config, "ollama_model"),
        )
    elif provider == "openai":
        return OpenAIClient(
            api_key=getattr(config, "openai_api_key"),
            model=getattr(config, "openai_model"),
        )
    else:
        raise ValueError(f"Unknown LLM provider: {provider!r}. Supported: ollama, openai")
