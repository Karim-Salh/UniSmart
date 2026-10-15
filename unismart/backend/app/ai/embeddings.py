"""تضمينات محلية بالكامل (لا API خارجي): intfloat/multilingual-e5-small، 384 بُعدًا، تدعم العربية والإنجليزية.
حمّل النموذج مرة واحدة أثناء البناء ثم شغّل الخادم بـ HF_HUB_OFFLINE=1."""
from functools import lru_cache
@lru_cache(maxsize=1)
def _model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("intfloat/multilingual-e5-small")
def embed(texts: list[str], kind: str = "passage") -> list[list[float]]:
    return _model().encode([f"{kind}: {t}" for t in texts], normalize_embeddings=True).tolist()
