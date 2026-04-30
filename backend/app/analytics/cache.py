import hashlib
from collections import Counter

def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def prefix_hash(s: str, n: int = 200) -> str:
    return sha256_hex(s[:n])

def prompt_hash(s: str) -> str:
    return sha256_hex(s)

def shingle_sim(a: str, b: str, k: int = 5) -> float:
    def shingles(x: str):
        x = x.lower()
        if len(x) < k:
            return Counter([x])
        return Counter([x[i:i+k] for i in range(len(x)-k+1)])
    sa, sb = shingles(a), shingles(b)
    inter = sum((sa & sb).values())
    union = sum((sa | sb).values())
    return inter / union if union else 0.0
