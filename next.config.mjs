// Guard: anything prefixed NEXT_PUBLIC_ is inlined into browser JavaScript.
// A Supabase secret / service_role key there is both rejected by Supabase
// ("Forbidden use of secret API key in browser") and publicly leaked, so
// refuse to build rather than ship it.
function isSecretSupabaseKey(value) {
  if (!value) return false;
  if (value.startsWith("sb_secret_")) return true;
  const parts = value.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }
  return false;
}

for (const [name, value] of Object.entries(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && isSecretSupabaseKey(value)) {
    throw new Error(
      `${name} contains a Supabase secret/service_role key, which must never be exposed to the browser. ` +
        `Set it to the publishable (sb_publishable_…) or anon key instead, and put the secret key in SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
