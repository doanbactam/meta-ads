# Ad Manager Dashboard

Modern advertising management dashboard built with Next.js 15, Prisma ORM, TanStack Table, and Tailwind CSS 4.

## Features

✅ **Prisma ORM Integration**
- PostgreSQL database with comprehensive schema
- Type-safe database access
- Relations between ad accounts, campaigns, ad groups, and creatives

✅ **Zod Validation**
- Runtime type validation
- Schema validation for all data models

✅ **TanStack Table v8**
- Advanced data table functionality
- Column visibility control
- Sorting and filtering capabilities

✅ **Modern UI**
- Tailwind CSS 4
- Collapsible sidebar with toggle
- Dark/Light mode support
- Ad account selector in navigation

✅ **Multi-Platform Support**
- Facebook Ads
- Instagram Ads
- LinkedIn Ads
- Messenger Ads

## Tech Stack

- **Framework**: Next.js 15
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Tables**: TanStack Table v8
- **Validation**: Zod
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your database connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/admanager?schema=public"
```

4. Generate Prisma Client
```bash
npm run prisma:generate
```

5. Push database schema
```bash
npm run prisma:push
```

6. Seed the database with sample data
```bash
npm run prisma:seed
```

7. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Database Schema

### AdAccount
- Multiple ad accounts per platform
- Platform: facebook, instagram, linkedin, messenger
- Status tracking

### Campaign
- Linked to ad account
- Budget and spend tracking
- Performance metrics (impressions, clicks, CTR, conversions)

### AdGroup
- Linked to campaign
- Granular budget control
- Detailed performance data

### Creative
- Linked to ad group
- Multiple formats (Image, Video, Carousel, Story)
- Engagement and ROAS tracking

## Project Structure

```
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   ├── ad-manager-dashboard.tsx
│   ├── campaign-table.tsx
│   ├── ad-groups-table.tsx
│   ├── creatives-table.tsx
│   ├── header.tsx
│   └── sidebar.tsx
├── lib/                   # Utility functions
│   ├── api/              # API functions
│   │   ├── ad-accounts.ts
│   │   ├── campaigns.ts
│   │   ├── ad-groups.ts
│   │   └── creatives.ts
│   ├── validations/      # Zod schemas
│   ├── prisma.ts         # Prisma client
│   └── utils.ts
├── prisma/               # Prisma configuration
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
└── types/               # TypeScript types
```

## Key Improvements

1. **Prisma ORM**: Replaced Supabase with Prisma for better type safety and flexibility
2. **Zod Validation**: Added comprehensive validation schemas
3. **TanStack Table**: Modern table library with advanced features
4. **Collapsible Sidebar**: Improved UX with toggleable sidebar
5. **Ad Account Selector**: Easy switching between ad accounts
6. **Tailwind CSS 4**: Latest version with improved performance

## Troubleshooting

### Error: "The table `public.users` does not exist"

This error occurs when the database hasn't been initialized. Follow these steps:

1. Ensure your `.env` file exists and has a valid `DATABASE_URL`:
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Push the schema to your database:
```bash
npm run prisma:push
```

4. Verify the tables were created:
```bash
npm run prisma:studio
```

### Error: "Environment variable not found: DATABASE_URL"

Make sure you've created a `.env` file from `.env.example` and configured all required environment variables including:
- `DATABASE_URL` - PostgreSQL connection string
- Clerk authentication keys
- Facebook API credentials (if using Facebook integration)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
