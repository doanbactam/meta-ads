import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            card: 'shadow-lg',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'border-border hover:bg-accent',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'border-border focus:border-primary',
            footerActionLink: 'text-primary hover:text-primary/90',
          },
        }}
      />
    </div>
  );
}
