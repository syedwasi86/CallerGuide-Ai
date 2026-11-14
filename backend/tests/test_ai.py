import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.services.ai_service import AiService, get_ai_service
from app.schemas.ai import SuggestionRequest, SuggestionResponse

client = TestClient(app)


def test_suggestion_validation_stage_bounds():
    """Verify stage_number must be between 1 and 8."""
    # Stage 0 should fail with 422
    resp = client.post("/api/calls/suggestions", json={"stage_number": 0})
    assert resp.status_code == 422

    # Stage 9 should fail with 422
    resp = client.post("/api/calls/suggestions", json={"stage_number": 9})
    assert resp.status_code == 422


def test_suggestion_do_not_call_guardrail_by_outcome():
    """Verify do_not_call outcome generates an immediate respectful exit without persuasion."""
    payload = {
        "stage_number": 6,
        "selected_outcome": "do_not_call",
        "prospect_words": "I am not interested.",
        "prospect_name": "Dev Sharma",
        "company_name": "Apex Logistics",
    }
    resp = client.post("/api/calls/suggestions", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "not contacted again" in data["suggestion"].lower() or "records" in data["suggestion"].lower()
    assert data["provider"] == "guardrail"
    assert "strictly prohibit" in data["rationale"].lower()


def test_suggestion_do_not_call_guardrail_by_words():
    """Verify prospect words containing 'don't call' or 'stop calling' triggers respectful exit."""
    payload = {
        "stage_number": 3,
        "prospect_words": "Please stop calling this number, do not call again.",
        "prospect_name": "Rathi",
        "company_name": "Suvarna",
    }
    resp = client.post("/api/calls/suggestions", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "guardrail"
    assert "remove" in data["suggestion"].lower() or "not contacted" in data["suggestion"].lower()


def test_suggestion_fallback_when_api_key_empty():
    """When LLM API key is empty, service provides transcript-grounded rule engine suggestions."""
    payload = {
        "stage_number": 6,
        "selected_outcome": "existing_provider_or_team",
        "prospect_words": "We already have an internal team handling this.",
        "prospect_name": "Rajiv Mehra",
        "company_name": "Kalyx Enterprises",
    }
    resp = client.post("/api/calls/suggestions", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["stage_number"] == 6
    assert len(data["suggestion"]) > 10
    assert data["is_fallback"] is True
    assert "internal" in data["suggestion"].lower() or "benchmark" in data["suggestion"].lower()
    assert data["rationale"] is not None


@pytest.mark.anyio
async def test_ai_service_llm_mock_success():
    """Verify live Gemini response parsing when API returns valid candidate."""
    service = AiService()
    service.api_key = "fake-test-key"

    mock_gemini_payload = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '{"suggestion": "I completely understand that your internal team handles production. '
                                'Would a 2-page brief on supply chain optimization be helpful to review?", '
                                '"alternative": "Understood. May I send a one-page summary on WhatsApp?", '
                                '"rationale": "Acknowledges internal capability without competing."}'
                            )
                        }
                    ]
                }
            }
        ]
    }

    mock_response = httpx.Response(200, json=mock_gemini_payload, request=httpx.Request("POST", "http://test"))

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        req = SuggestionRequest(
            stage_number=6,
            prospect_words="We do this in house",
            prospect_name="Anita",
            company_name="Apex Ltd",
        )
        res = await service.generate_suggestion(req)
        assert res.provider == "gemini"
        assert res.is_fallback is False
        assert "internal team" in res.suggestion.lower()
        assert "supply chain" in res.suggestion.lower()


@pytest.mark.anyio
async def test_ai_service_timeout_handling():
    """Verify that a timeout on Gemini API gracefully falls back to transcript heuristics."""
    service = AiService()
    service.api_key = "fake-test-key"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Connection timed out after 5.0s")
        req = SuggestionRequest(
            stage_number=2,
            prospect_words="What is this regarding?",
            prospect_name="Priya",
            company_name="Kalpana Chem",
        )
        res = await service.generate_suggestion(req)
        assert res.is_fallback is True
        assert len(res.suggestion) > 10
        assert "Kalpana Chem" in res.suggestion or "growth" in res.suggestion.lower()
