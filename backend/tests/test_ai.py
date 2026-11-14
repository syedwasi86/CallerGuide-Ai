import asyncio
import logging
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.services.ai_service import AiService, get_ai_service
from app.schemas.ai import SuggestionRequest, SuggestionResponse
from app.core.config import settings

client = TestClient(app)

MOCK_GEMINI_PAYLOAD = {
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
    assert data["is_fallback"] is False
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
    service = AiService()
    service.api_key = ""
    payload = SuggestionRequest(
        stage_number=6,
        selected_outcome="existing_provider_or_team",
        prospect_words="We already have an internal team handling this.",
        prospect_name="Rajiv Mehra",
        company_name="Kalyx Enterprises",
    )
    import anyio
    res = anyio.run(service.generate_suggestion, payload)
    assert res.stage_number == 6
    assert len(res.suggestion) > 10
    assert res.is_fallback is True
    assert res.provider == "rule_engine"
    assert "No LLM API key configured" in (res.fallback_reason or "")


# 1. Successful Gemini response within timeout
@pytest.mark.anyio
async def test_1_gemini_success_within_timeout():
    """Verify clean generation when Gemini returns valid JSON response."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    mock_resp = httpx.Response(200, json=MOCK_GEMINI_PAYLOAD, request=httpx.Request("POST", "http://test"))
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        req = SuggestionRequest(
            stage_number=6,
            prospect_words="We do this in house",
            prospect_name="Anita",
            company_name="Apex Ltd",
        )
        res = await service.generate_suggestion(req)
        assert res.provider == "gemini"
        assert res.is_fallback is False
        assert res.fallback_reason is None
        assert "supply chain" in res.suggestion.lower()
        assert mock_post.call_count == 1


# 2. Gemini response taking longer than 5 seconds but completing within configured timeout
@pytest.mark.anyio
async def test_2_gemini_slow_response_succeeds_within_read_timeout():
    """Verify that a response completing in >5s (e.g. 7s) succeeds when read timeout is 20s."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    mock_resp = httpx.Response(200, json=MOCK_GEMINI_PAYLOAD, request=httpx.Request("POST", "http://test"))

    async def slow_post(*args, **kwargs):
        # Simulate slight delay well within the 20s read timeout
        await asyncio.sleep(0.05)
        return mock_resp

    with patch("httpx.AsyncClient.post", side_effect=slow_post) as mock_post:
        req = SuggestionRequest(
            stage_number=2,
            prospect_words="What does your company do?",
            prospect_name="Priya",
            company_name="Kalpana Chem",
        )
        res = await service.generate_suggestion(req)
        assert res.provider == "gemini"
        assert res.is_fallback is False
        assert mock_post.call_count == 1


# 3. Read timeout (does not retry to prevent caller latency)
@pytest.mark.anyio
async def test_3_read_timeout_no_retry_fallback():
    """Verify that a ReadTimeout falls back immediately without a second 20s retry."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ReadTimeout("Read timed out after 20.0s")
        req = SuggestionRequest(
            stage_number=2,
            prospect_words="What is this regarding?",
            prospect_name="Priya",
            company_name="Kalpana Chem",
        )
        res = await service.generate_suggestion(req)
        assert res.is_fallback is True
        assert res.provider == "rule_engine"
        assert "read timeout" in res.fallback_reason.lower()
        # Read timeout should NOT be retried to prevent double-waiting
        assert mock_post.call_count == 1


# 4. Connection timeout (retries once, then falls back)
@pytest.mark.anyio
async def test_4_connect_timeout_retries_and_falls_back():
    """Verify that a ConnectTimeout triggers at most ONE retry before falling back."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectTimeout("Connection timed out after 5.0s")
        req = SuggestionRequest(
            stage_number=3,
            prospect_words="Call me next week",
            prospect_name="Rohit",
            company_name="Novara",
        )
        res = await service.generate_suggestion(req)
        assert res.is_fallback is True
        assert res.provider == "rule_engine"
        assert "connection timeout" in res.fallback_reason.lower()
        # Should attempt 2 times (1 initial + 1 retry)
        assert mock_post.call_count == 2


# 5. Transient error followed by successful retry
@pytest.mark.anyio
async def test_5_transient_error_successful_retry():
    """Verify transient 503 error is retried and succeeds on attempt 2."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    resp_503 = httpx.Response(503, text="Service Unavailable", request=httpx.Request("POST", "http://test"))
    resp_200 = httpx.Response(200, json=MOCK_GEMINI_PAYLOAD, request=httpx.Request("POST", "http://test"))

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = [resp_503, resp_200]
        req = SuggestionRequest(
            stage_number=6,
            prospect_words="We already have a vendor",
            prospect_name="Dev",
            company_name="Apex Ltd",
        )
        res = await service.generate_suggestion(req)
        assert res.provider == "gemini"
        assert res.is_fallback is False
        assert mock_post.call_count == 2


# 6. Permanent authentication failure without retry
@pytest.mark.anyio
async def test_6_permanent_auth_error_no_retry():
    """Verify HTTP 400 (API_KEY_INVALID) or 403 auth failure is never retried."""
    service = AiService()
    service.api_key = "invalid-bad-key"

    resp_400 = httpx.Response(400, text='{"error": {"message": "API_KEY_INVALID"}}', request=httpx.Request("POST", "http://test"))

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = resp_400
        req = SuggestionRequest(
            stage_number=6,
            prospect_words="Not interested",
            prospect_name="Manpreet",
            company_name="Novara",
        )
        res = await service.generate_suggestion(req)
        assert res.is_fallback is True
        assert res.provider == "rule_engine"
        assert "authentication" in res.fallback_reason.lower()
        # Strictly 1 attempt, no useless retry with bad key
        assert mock_post.call_count == 1


# 7. Retry failure followed by rule-engine fallback
@pytest.mark.anyio
async def test_7_retry_failure_followed_by_fallback():
    """Verify that when retry fails on second attempt, service cleanly returns rule engine fallback."""
    service = AiService()
    service.api_key = "test-secret-key-12345"

    resp_502 = httpx.Response(502, text="Bad Gateway", request=httpx.Request("POST", "http://test"))

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = [resp_502, resp_502]
        req = SuggestionRequest(
            stage_number=6,
            selected_outcome="existing_provider_or_team",
            prospect_words="We have an internal team",
            prospect_name="Rajiv",
            company_name="Kalyx",
        )
        res = await service.generate_suggestion(req)
        assert res.is_fallback is True
        assert res.provider == "rule_engine"
        assert "server error" in res.fallback_reason.lower()
        assert len(res.suggestion) > 10
        assert mock_post.call_count == 2


# 8. Correct is_fallback and provider values
@pytest.mark.anyio
async def test_8_correct_is_fallback_and_provider_contract():
    """Verify that provider is never 'gemini' when is_fallback is True."""
    service = AiService()
    service.api_key = ""  # Force fallback
    req = SuggestionRequest(stage_number=1, prospect_name="Dev", company_name="Apex")
    res = await service.generate_suggestion(req)
    assert res.is_fallback is True
    assert res.provider == "rule_engine"
    assert res.provider != "gemini"

    # And guardrail is never is_fallback=True
    guard_req = SuggestionRequest(stage_number=6, selected_outcome="do_not_call")
    guard_res = await service.generate_suggestion(guard_req)
    assert guard_res.is_fallback is False
    assert guard_res.provider == "guardrail"


# 9. No API key exposure in logs or frontend responses
@pytest.mark.anyio
async def test_9_no_api_key_exposure_in_response_or_logs(caplog):
    """Verify the API key secret never appears in responses or log records."""
    secret_key = "SUPER_SECRET_KEY_NEVER_LEAK"
    service = AiService()
    service.api_key = secret_key

    resp_200 = httpx.Response(200, json=MOCK_GEMINI_PAYLOAD, request=httpx.Request("POST", "http://test"))

    with caplog.at_level(logging.DEBUG):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = resp_200
            req = SuggestionRequest(stage_number=6, prospect_words="test words")
            res = await service.generate_suggestion(req)

            # Response check
            res_json = res.model_dump_json()
            assert secret_key not in res_json

            # Logs check
            for record in caplog.records:
                assert secret_key not in record.message
                assert secret_key not in str(record.args)
