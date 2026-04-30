from app.routing.policy import choose_model

def test_choose_model_short_non_code_goes_mini():
    payload = {"model":"gpt-4o", "messages":[{"role":"user","content":"summarize this"}]}
    assert choose_model(payload, "gpt-4o") == "gpt-4o-mini"

def test_choose_model_codey_stays():
    payload = {"model":"gpt-4o", "messages":[{"role":"user","content":"```python\ndef x():\n  return 1\n```"}]}
    assert choose_model(payload, "gpt-4o") == "gpt-4o"
