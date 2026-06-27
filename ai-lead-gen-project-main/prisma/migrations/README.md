# Database Migrations

This project now tracks schema history with Prisma Migrate. `0_init` is the
baseline migration generated from the full schema.

## Current deploy behaviour

`vercel-build` runs `prisma db push` (without `--accept-data-loss`, so it will
**error** instead of silently dropping data) and is safe against the existing
Neon database.

## Switching production to `migrate deploy` (recommended once baselined)

The existing production database was created with `db push`, so it has the
tables but no `_prisma_migrations` history. Baseline it **once** from an
environment that can reach the database directly (port 5432), e.g. locally:

```bash
# uses DATABASE_DIRECT_URL from your env
npm run prisma:baseline      # prisma migrate resolve --applied 0_init
```

After baselining, change `vercel-build` in package.json to:

```
prisma generate && prisma migrate deploy && next build
```

From then on, create new migrations with `npx prisma migrate dev --name <name>`
and they will be applied automatically on deploy.
