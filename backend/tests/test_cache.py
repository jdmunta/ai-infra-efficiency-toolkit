from app.analytics.cache import prompt_hash, prefix_hash, shingle_sim

def test_hashes_stable():
    s = "hello world"
    assert prompt_hash(s) == prompt_hash(s)
    assert prefix_hash(s, n=3) == prefix_hash(s, n=3)

def test_shingle_similarity_bounds():
    a = "abcdefg"
    b = "abcxxxx"
    sim = shingle_sim(a, b, k=3)
    assert 0.0 <= sim <= 1.0
    assert shingle_sim(a, a, k=3) == 1.0
