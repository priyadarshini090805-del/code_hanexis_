/**
 * Creates a local-demo `.env.local` with safe defaults if one doesn't exist.
 * These are throwaway secrets for the OFFLINE local demo only (SQLite +
 * localhost) — never used in production. Run automatically by `setup:local`.
 *
 * It will NOT overwrite an existing .env.local (so your real keys are kept).
 */
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), '.env.local');
if (fs.existsSync(target)) {
  console.log('ℹ️  .env.local already exists — keeping it.');
  process.exit(0);
}

const DEMO = `# Auto-generated for the local (offline) demo — safe throwaway values.
# The app runs on a local SQLite file, so no database URL is needed here.

# --- Auth / security (local demo secrets) ---
JWT_SECRET="local-demo-jwt-secret-0123456789abcdef0123456789"
JWT_REFRESH_SECRET="local-demo-refresh-secret-0123456789abcdef012345"
NEXTAUTH_SECRET="local-demo-nextauth-secret-0123456789abcdef0123"
AUTH_SECRET="local-demo-auth-secret-0123456789abcdef0123456789"
CSRF_SECRET="local-demo-csrf-secret-0123456789abcdef0123456789"
ENCRYPTION_KEY="local-demo-encryption-key-32-chars-min-0123456789"
CRON_SECRET="local-demo-cron-secret"

# --- App URLs ---
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# --- AI (optional) ---
# Leave blank to use built-in templates offline. Add a real OpenRouter key
# to enable live AI generation:
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct"

# --- Optional integrations (not needed for the offline demo) ---
RESEND_API_KEY=""
EMAIL_FROM="onboarding@resend.dev"
LOG_LEVEL="info"
`;

fs.writeFileSync(target, DEMO, 'utf8');
console.log('✅ Created .env.local with local demo defaults.');
