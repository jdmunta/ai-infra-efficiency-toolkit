from app.main import is_codey, len_bucket, detect_has_tools

def test_is_codey():
    assert is_codey("```python\ndef x():\n  return 1\n```") is True
    assert is_codey("def hello(): return 1") is True
    assert is_codey("Just a normal sentence.") is False

def test_len_bucket():
    assert len_bucket(0) == "0-300"
    assert len_bucket(300) == "0-300"
    assert len_bucket(301) == "300-1200"
    assert len_bucket(1200) == "300-1200"
    assert len_bucket(1201) == "1200+"

def test_detect_has_tools():
    assert detect_has_tools({"tools":[{"type":"function"}]}) is True
    assert detect_has_tools({"tool_choice":"auto"}) is True
    assert detect_has_tools({"messages":[{"role":"assistant","tool_calls":[{"id":"1"}]}]}) is True
    assert detect_has_tools({"messages":[{"role":"user","content":"hi"}]}) is False
