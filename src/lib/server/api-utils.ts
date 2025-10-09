import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { safeParseDate } from '@/lib/shared/data-sanitizer';

/**
 * Utility function để handle authentication và params trong API routes
 */
export async function withAuth<T extends { id: string }>(
  params: Promise<T>,
  handler: (userId: string, resolvedParams: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    return await handler(userId, resolvedParams);
  } catch (error) {
    // If error is already a NextResponse (from verifyAdAccountAccess), return it directly
    if (error instanceof NextResponse) {
      return error;
    }

    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Utility function để verify user có access đến ad account
 * Returns the ad account if found, throws NextResponse if not found (for proper error handling)
 */
export async function verifyAdAccountAccess(userId: string, adAccountId: string) {
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      userId: userId,
    },
  });

  if (!adAccount) {
    // Return a NextResponse instead of throwing generic Error
    // This allows proper HTTP status codes and error handling
    const error = NextResponse.json(
      { error: 'Ad account not found or access denied' },
      { status: 404 }
    );
    // Throw as a special marker that can be caught by withAuth
    throw error;
  }

  return adAccount;
}

/**
 * Utility function để parse date range từ search params
 */
export function parseDateRange(searchParams: URLSearchParams) {
  const fromRaw = searchParams.get('from');
  const toRaw = searchParams.get('to');

  const from = safeParseDate(fromRaw);
  const to = safeParseDate(toRaw);

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  return {
    dateFilter: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
    from,
    to,
  };
}

/**
 * Utility function để calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Utility function để handle pagination
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Standard error responses
 */
export const ErrorResponses = {
  unauthorized: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  notFound: (resource = 'Resource') =>
    NextResponse.json({ error: `${resource} not found` }, { status: 404 }),
  badRequest: (message = 'Bad request') => NextResponse.json({ error: message }, { status: 400 }),
  internalError: (message = 'Internal server error') =>
    NextResponse.json({ error: message }, { status: 500 }),
} as const;
