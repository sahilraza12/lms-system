This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Seed demo data

Configure `DATABASE_URL` and `DIRECT_URL`, then set a `SEED_PASSWORD` of 12–72 UTF-8 bytes before running `npx prisma db seed`. The seed is transactional and repeatable, does not delete existing records, preserves passwords on existing accounts by default, and refuses to run when `NODE_ENV` is `production`. To intentionally change passwords for the five seeded demo accounts, set `SEED_RESET_PASSWORDS=true` for that seed run.

In PowerShell:

```powershell
$env:SEED_PASSWORD = "replace-with-a-strong-demo-password"
$env:SEED_RESET_PASSWORDS = "true"
npx prisma db seed
$env:SEED_RESET_PASSWORDS = "false"
```

Use a database owner/direct connection for `DIRECT_URL` (not a pooled connection). Set the two password environment variables in the same PowerShell session where the seed command runs.

For production, configure a private `JWT_SECRET` containing at least 32 characters. The application refuses to issue or verify sessions without it; development uses a local-only fallback.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
