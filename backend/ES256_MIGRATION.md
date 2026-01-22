# 🔐 Supabase ES256 JWT Authentication Migration

## ✅ What Changed

Your API now uses **Supabase's new JWT Signing Keys** with ES256 asymmetric encryption instead of the deprecated legacy HMAC secret.

### Old (Deprecated) ❌

- HMAC-based symmetric encryption
- Single shared secret
- Less secure

### New (Current) ✅

- ES256 (ECDSA) asymmetric encryption
- Public/Private key pair
- Industry standard, more secure

## 🔑 Your JWT Public Key (Already Configured)

Your `.env` file now contains:

```env
SUPABASE_JWT_PUBLIC_KEY={"x":"wxitm-eWq8F8hs2tsQr5MVzQOEfxXya7Co6kl5I60dY","y":"bYV3AfCwjRchi7VZtYfTZCEQXFMuJrO0ezq99NRio9Y","alg":"ES256","crv":"P-256","ext":true,"kid":"acbb92e2-ca85-4122-b3c6-281a3d54cd82","kty":"EC","key_ops":["verify"]}
```

### Key Details:

- **Algorithm**: ES256 (ECDSA with SHA-256)
- **Curve**: P-256 (secp256r1)
- **Key ID**: `acbb92e2-ca85-4122-b3c6-281a3d54cd82`
- **Type**: Elliptic Curve (EC)
- **Operation**: Verify only (public key)

## 📋 How to Get Your JWT Public Key

If you need to update it in the future:

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **Settings → API**
4. Scroll to **JWT Settings**
5. Copy the **Public Key (JWK)** JSON
6. Paste it as a **single line** in your `.env` file

**Important**: The JWK must be on one line with no line breaks!

## 🧪 Testing

### Test the backend:

```powershell
cd backend
go run main.go
```

### From the frontend:

1. Log in to your dashboard
2. Click "Run Script"
3. Check backend logs - you should see:
   ```
   Request authorized via JWT token (ES256) for user: your@email.com from IP: ...
   ```

## 🔍 Technical Details

### JWK Structure Explained

```json
{
  "x": "wxitm-eWq8F8hs2tsQr5MVzQOEfxXya7Co6kl5I60dY", // X coordinate (base64url)
  "y": "bYV3AfCwjRchi7VZtYfTZCEQXFMuJrO0ezq99NRio9Y", // Y coordinate (base64url)
  "alg": "ES256", // Algorithm: ECDSA with P-256 + SHA-256
  "crv": "P-256", // Curve: NIST P-256 / secp256r1
  "ext": true, // Extractable
  "kid": "acbb92e2-ca85-4122-b3c6-281a3d54cd82", // Key ID
  "kty": "EC", // Key Type: Elliptic Curve
  "key_ops": ["verify"] // Operations: Verify only
}
```

### How Verification Works

1. **Frontend** gets JWT from Supabase when user logs in
2. **Frontend** sends JWT in `Authorization: Bearer <token>` header
3. **Backend** extracts the token
4. **Backend** parses the JWK to get the ECDSA public key
5. **Backend** verifies the token signature using ES256 algorithm
6. **Backend** validates claims (expiration, issuer, etc.)
7. **Backend** allows or denies the request

## 🔒 Security Benefits

**ES256 vs HMAC-SHA256:**

- ✅ Public key can be shared safely
- ✅ Private key never leaves Supabase servers
- ✅ Cannot forge tokens even with public key
- ✅ Industry standard (used by Google, Microsoft, etc.)
- ✅ Better key management and rotation

## 🛠️ Code Changes Made

### 1. Middleware (`backend/middleware/auth.go`)

- Added JWK parsing function
- Changed from HMAC verification to ES256/ECDSA
- Validates signing method is ES256
- Extracts x,y coordinates and builds ECDSA public key

### 2. Environment (`.env`)

- Replaced `SUPABASE_JWT_SECRET` with `SUPABASE_JWT_PUBLIC_KEY`
- Store entire JWK JSON as single-line string

### 3. No Frontend Changes Needed

- Frontend already sends JWT tokens correctly
- Token format remains the same
- Only backend verification changed

## ❓ Troubleshooting

### "Invalid JWT signing key configuration"

- Check that `SUPABASE_JWT_PUBLIC_KEY` is set in `.env`
- Verify the JWK is valid JSON
- Ensure it's on a single line (no line breaks)

### "Unexpected signing method"

- Your token might be using the old HMAC format
- Log out and log back in to get a new ES256 token
- Clear browser cache/localStorage

### "Failed to parse JWK"

- Check JSON syntax (use a JSON validator)
- Ensure quotes are properly escaped in `.env` file
- Verify x and y values are base64url encoded

## 📚 Additional Resources

- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth/jwts)
- [ES256 Algorithm Specification](https://tools.ietf.org/html/rfc7518#section-3.4)
- [JSON Web Key (JWK) Format](https://tools.ietf.org/html/rfc7517)

---

**Migration Complete!** 🎉 Your API now uses modern ES256 asymmetric JWT verification.
