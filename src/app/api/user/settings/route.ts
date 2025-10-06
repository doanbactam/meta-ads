import { NextResponse } from 'next/server';

// User settings are now auto-detected from browser/system
// This endpoint returns a simple success response for compatibility
export async function GET() {
  return NextResponse.json({
    message: 'User settings are auto-detected from browser/system',
    autoDetected: true,
  });
}
