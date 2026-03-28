"""
Run this ONCE to generate your VAPID keys:
    pip install py-vapid pywebpush
    python generate_vapid.py

Then copy the output into your backend/.env file.
"""
from py_vapid import Vapid
import base64

v = Vapid()
v.generate_keys()

# Export public key in base64url format (needed by browser Push API)
public_key_bytes = v.public_key.public_bytes(
    __import__('cryptography').hazmat.primitives.serialization.Encoding.X962,
    __import__('cryptography').hazmat.primitives.serialization.PublicFormat.UncompressedPoint
)
public_b64 = base64.urlsafe_b64encode(public_key_bytes).rstrip(b'=').decode()

# Export private key in PEM format
private_pem = v.private_key.private_bytes(
    __import__('cryptography').hazmat.primitives.serialization.Encoding.PEM,
    __import__('cryptography').hazmat.primitives.serialization.PrivateFormat.TraditionalOpenSSL,
    __import__('cryptography').hazmat.primitives.serialization.NoEncryption()
).decode()

print("=" * 60)
print("Add these to your backend/.env file:")
print("=" * 60)
print(f'VAPID_PUBLIC_KEY="{public_b64}"')
print(f'VAPID_PRIVATE_KEY="{private_pem.strip()}"')
print(f'VAPID_CONTACT="mailto:your-email@example.com"')
print()
print("=" * 60)
print("Add this to your frontend as VITE_VAPID_PUBLIC_KEY:")
print("=" * 60)
print(f'VITE_VAPID_PUBLIC_KEY="{public_b64}"')