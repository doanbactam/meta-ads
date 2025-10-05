import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            card: 'shadow-lg border-border',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'border-border hover:bg-accent hover:text-accent-foreground',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'border-border focus:border-primary bg-background text-foreground',
            footerActionLink: 'text-primary hover:text-primary/90',
            identityPreviewText: 'text-foreground',
            identityPreviewEditButton: 'text-muted-foreground hover:text-foreground',
          },
        }}
      />
    </div>
  );
}
