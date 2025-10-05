/**
 * Next.js 15 Instrumentation
 * This file runs once when the server starts
 * Use for: telemetry, logging initialization, environment validation, startup tasks
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Environment validation
    const requiredEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'DATABASE_URL',
    ];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Log startup
    console.log('🚀 Server instrumentation initialized');
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);

    // Add OpenTelemetry, logging, or monitoring setup here
    // Example:
    // await setupTelemetry();
    // await initializeLogger();
  }
}
