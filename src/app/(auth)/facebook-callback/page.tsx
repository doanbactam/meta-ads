'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function FacebookCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Facebook authentication...');

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Check if window.opener exists
        if (!window.opener) {
          setStatus('error');
          setMessage('This page should be opened from the main application.');
          return;
        }

        // Extract the access token from the URL hash fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        const errorReason = params.get('error_reason');

        if (error) {
          setStatus('error');
          const errorMsg = errorDescription || errorReason || error || 'Authentication failed';
          setMessage(errorMsg);

          // Send error message to parent window
          try {
            window.opener.postMessage(
              {
                type: 'facebook-auth-error',
                error: errorMsg,
              },
              window.location.origin
            );
          } catch (e) {
            console.error('Failed to send error message to parent:', e);
          }

          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        if (!accessToken) {
          setStatus('error');
          setMessage('No access token received. Please try again.');

          try {
            window.opener.postMessage(
              {
                type: 'facebook-auth-error',
                error: 'No access token received',
              },
              window.location.origin
            );
          } catch (e) {
            console.error('Failed to send error message to parent:', e);
          }

          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        // Validate access token format (basic check)
        if (accessToken.length < 20) {
          setStatus('error');
          setMessage('Invalid access token format received.');

          try {
            window.opener.postMessage(
              {
                type: 'facebook-auth-error',
                error: 'Invalid access token format',
              },
              window.location.origin
            );
          } catch (e) {
            console.error('Failed to send error message to parent:', e);
          }

          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        // Successfully received access token
        setStatus('success');
        setMessage('Authentication successful! Closing window...');

        // Send the access token to the parent window
        try {
          window.opener.postMessage(
            {
              type: 'facebook-auth-success',
              accessToken,
            },
            window.location.origin
          );
        } catch (e) {
          console.error('Failed to send token to parent:', e);
          setStatus('error');
          setMessage('Failed to communicate with parent window.');
          return;
        }

        // Close the popup after a short delay
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.error('Failed to close window:', e);
          }
        }, 1500);
      } catch (err) {
        console.error('Error processing callback:', err);
        setStatus('error');
        setMessage('An error occurred while processing authentication.');

        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: 'facebook-auth-error',
                error: err instanceof Error ? err.message : 'Processing error',
              },
              window.location.origin
            );
          } catch (e) {
            console.error('Failed to send error message to parent:', e);
          }
        }

        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.error('Failed to close window:', e);
          }
        }, 3000);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(handleCallback, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <h1 className="text-xl font-semibold">{message}</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <h1 className="text-xl font-semibold text-green-600">{message}</h1>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-600" />
            <h1 className="text-xl font-semibold text-red-600">Authentication Failed</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
