import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64

# Security configuration
SECRET_KEY = os.getenv("FORENSIC_MASTER_KEY", "fallback-secret-key-don-not-use-in-prod")
SALT = os.getenv("ENCRYPTION_SALT", "static-salt-for-demo")

def get_encryption_key():
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT.encode(),
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(SECRET_KEY.encode())

def encrypt_audio(data: bytes) -> bytes:
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return base64.b64encode(nonce + ciphertext)

def decrypt_audio(encrypted_data: bytes) -> bytes:
    data = base64.b64decode(encrypted_data)
    nonce = data[:12]
    ciphertext = data[12:]
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)
