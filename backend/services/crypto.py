"""
Credential encryption service using Fernet (AES-128-CBC + HMAC-SHA256).

Key storage:
  - CLOUDSENTRIX_ENC_KEY env var (production)
  - Or derived from JWT secret + project constant (fallback for dev)

Envelope: all stored values are prefixed with "enc::" to mark them encrypted,
so we can detect unencrypted legacy values and migrate them on read.
"""

import os
import base64
import hashlib
from typing import Optional

try:
    from cryptography.fernet import Fernet, InvalidToken
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

ENC_PREFIX = "enc::"


def _derive_key() -> bytes:
    """Derive a Fernet key. Uses env var if set, else deterministic fallback."""
    env_key = os.environ.get("CLOUDSENTRIX_ENC_KEY")
    if env_key:
        # User provided raw Fernet key
        try:
            return env_key.encode() if isinstance(env_key, str) else env_key
        except Exception:
            pass

    # Fallback: derive from JWT secret (stable across restarts)
    # This is not ideal — prefer CLOUDSENTRIX_ENC_KEY in production.
    jwt_secret = os.environ.get("CLOUDSENTRIX_JWT_SECRET",
                                "cloudlunar-enterprise-secret-change-in-production-2024")
    seed = hashlib.sha256(f"cloudsentrix-creds-v1:{jwt_secret}".encode()).digest()
    # Fernet requires 32 url-safe base64 bytes
    return base64.urlsafe_b64encode(seed)


_fernet: Optional[Fernet] = None

def _cipher() -> Optional[Fernet]:
    global _fernet
    if not CRYPTO_AVAILABLE:
        return None
    if _fernet is None:
        try:
            _fernet = Fernet(_derive_key())
        except Exception:
            _fernet = None
    return _fernet


def encrypt(plaintext: Optional[str]) -> Optional[str]:
    """Encrypt a string and return a storage-ready value with `enc::` prefix.

    Returns None for None, empty string for empty string.
    Returns already-encrypted value unchanged (idempotent).
    """
    if plaintext is None:
        return None
    if plaintext == "":
        return ""
    if plaintext.startswith(ENC_PREFIX):
        return plaintext  # already encrypted
    c = _cipher()
    if not c:
        return plaintext  # crypto unavailable — leave as-is (log warning separately)
    try:
        token = c.encrypt(plaintext.encode("utf-8")).decode("ascii")
        return f"{ENC_PREFIX}{token}"
    except Exception:
        return plaintext


def decrypt(value: Optional[str]) -> Optional[str]:
    """Decrypt a stored value. If value is not encrypted (legacy), return as-is."""
    if value is None:
        return None
    if value == "":
        return ""
    if not value.startswith(ENC_PREFIX):
        return value  # legacy plaintext
    c = _cipher()
    if not c:
        return None
    try:
        token = value[len(ENC_PREFIX):]
        return c.decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        return None
    except Exception:
        return None


def is_encrypted(value: Optional[str]) -> bool:
    return bool(value) and value.startswith(ENC_PREFIX)


def generate_key() -> str:
    """Generate a fresh Fernet key for the CLOUDSENTRIX_ENC_KEY env var."""
    if not CRYPTO_AVAILABLE:
        raise RuntimeError("cryptography package not installed")
    return Fernet.generate_key().decode()
