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
      afterSignInUrl="/call"
      afterSignUpUrl="/call"
      signInForceRedirectUrl="/call"
      signUpForceRedirectUrl="/call"
      appearance={{
        variables: {
          colorPrimary: "#7C3AED",
          colorPrimaryHover: "#6D28D9",
          colorText: "#FFFFFF",
          colorTextSecondary: "#A1A1AA",
          colorBackground: "#09090B",
          colorInputBackground: "#111113",
          colorInputText: "#FFFFFF",
          colorSurface: "#111113",
          colorBorder: "rgba(255,255,255,0.1)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: "12px",
        },
        elements: {
          rootBox: "w-full",
          card: "bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-6 sm:p-8",
          headerTitle: "text-white font-semibold text-xl font-['Space_Grotesk',sans-serif]",
          headerSubtitle: "text-gray-400 text-sm",
          socialButtonsBlockButton: "bg-white/[0.06] hover:bg-white/10 border-white/15 hover:border-white/25 text-white font-medium rounded-xl transition-all",
          socialButtonsBlockButtonText: "text-white font-medium text-sm",
          socialButtonsBlockButtonArrow: "text-white",
          formFieldLabel: "text-gray-300 text-sm font-medium mb-2 block",
          formFieldInput: "bg-[#111113] border-white/15 text-white rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 text-sm transition-all",
          formButtonPrimary: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold normal-case rounded-xl shadow-lg shadow-violet-500/30 transition-all py-3",
          formButtonSecondary: "bg-white/[0.06] hover:bg-white/10 border-white/15 text-white font-medium normal-case rounded-xl transition-all py-3",
          formButtonReset: "text-gray-400 hover:text-white text-sm font-normal",
          footerActionLink: "text-violet-400 hover:text-violet-300 font-medium text-sm",
          footerActionText: "text-gray-500 text-sm",
          dividerText: "text-gray-500 text-sm",
          identityPreview: "text-white",
          identityPreviewText: "text-gray-300",
          identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
          alertBox: "bg-red-500/10 border-red-500/20 text-red-400 rounded-xl",
          alertBoxText: "text-red-400 text-sm",
          avatarBox: "border-2 border-violet-500",
          optionalTag: "text-gray-500 text-xs",
          codeFieldInput: "bg-[#111113] border-white/15 text-white rounded-xl font-mono text-sm",
          phoneInputComponent: "bg-[#111113] border-white/15 text-white rounded-xl",
          otpCodeFieldRow: "gap-2 flex",
          otpCodeFieldInput: "bg-[#111113] border-white/15 text-white rounded-xl text-center text-lg font-mono",
          memberPageEmailLink: "text-violet-400 hover:text-violet-300",
          organizationSwitcherTrigger: "bg-white/[0.06] hover:bg-white/10 border-white/15 rounded-xl transition-all",
          organizationSwitcherTriggerIcon: "text-gray-400",
          organizationSwitcherTriggerText: "text-white font-medium",
          userPreview: "text-white",
          userPreviewAvatarBox: "border-2 border-violet-500",
          userPreviewPrimaryIdentifier: "text-white font-medium",
          userPreviewSecondaryIdentifier: "text-gray-400 text-sm",
          headerStepIndicator: "text-gray-400",
          headerStepIndicatorActive: "text-violet-400",
          navbar: "bg-transparent border-b border-white/10",
          navbarButton: "text-gray-400 hover:text-white",
          navbarButtonHover: "bg-white/[0.06]",
          scrollArea: "scroll-hide",
          image: "rounded-xl",
          badge: "bg-violet-500/20 text-violet-300 text-xs font-medium",
          modalBackdrop: "bg-black/60 backdrop-blur-sm",
          popoverCard: "bg-[#111113] border-white/10 rounded-2xl shadow-2xl",
          tooltipArrow: "fill-[#111113]",
          tooltipContent: "bg-[#111113] text-white text-sm border border-white/10",
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
