import PropTypes from "prop-types";
import { ClerkProvider } from "@clerk/clerk-react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env.local file — see .env.example."
  );
}

/**
 * Wraps the app with Clerk's provider and applies a custom
 * appearance theme so Clerk's hosted components (sign-in, sign-up,
 * user profile) match the Lisa AI dark/glassmorphism design system.
 */
export function ClerkAuthProvider({ children }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: "#7C3AED",
          colorBackground: "#111113",
          colorInputBackground: "#09090B",
          colorText: "#FFFFFF",
          colorTextSecondary: "#A1A1AA",
          borderRadius: "1rem",
          fontFamily: "'Inter', sans-serif",
        },
        elements: {
          card: "glass-panel",
          headerTitle: "font-heading",
          formButtonPrimary:
            "bg-gradient-primary hover:opacity-90 transition-opacity",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

ClerkAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
