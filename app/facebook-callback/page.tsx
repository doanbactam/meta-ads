'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FacebookCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Facebook authentication...');

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Extract the access token from the URL hash fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed. Please try again.');

          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'facebook-auth-error',
              error: errorDescription || error,
            }, window.location.origin);
          }

          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        if (!accessToken) {
          setStatus('error');
          setMessage('No access token received. Please try again.');

          if (window.opener) {
            window.opener.postMessage({
              type: 'facebook-auth-error',
              error: 'No access token received',
            }, window.location.origin);
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
        if (window.opener) {
          window.opener.postMessage({
            type: 'facebook-auth-success',
            accessToken,
          }, window.location.origin);
        }

        // Close the popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err) {
        console.error('Error processing callback:', err);
        setStatus('error');
        setMessage('An error occurred while processing authentication.');

        if (window.opener) {
          window.opener.postMessage({
            type: 'facebook-auth-error',
            error: 'Processing error',
          }, window.location.origin);
        }

        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

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
