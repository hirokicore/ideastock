# IdeaStock Monorepo

## Apps

| App | Path | Description |
|-----|------|-------------|
| IdeaStock | `apps/ideastock` | AI-powered idea management |
| Business Plan | `apps/business-plan` | Business plan builder from ideas |

## Development

```bash
# IdeaStock
npm run dev:ideastock

# Business Plan
npm run dev:business-plan
```

## Vercel Deployment

Each app is a separate Vercel project. Set **Root Directory** in Vercel project settings:
- IdeaStock: `apps/ideastock`
- Business Plan: `apps/business-plan`
