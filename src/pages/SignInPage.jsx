import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Shield } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center relative overflow-hidden">
      {/* Background Effects - unchanged */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[30%] -left-[20%] w-[60%] h-[60%] bg-gradient-to-br from-violet-600/12 to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[50%] h-[50%] bg-gradient-to-tl from-cyan-600/8 to-transparent rounded-full blur-[80px]" />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl mx-auto px-6"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <img src="/favicon.png" alt="Lisa AI" className="w-14 h-14 rounded-2xl object-cover mb-5" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-['Space_Grotesk',sans-serif]">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Sign in to continue your conversation with Lisa
          </p>
        </div>

        {/* 👇 Removed the card container – SignIn is now directly on the background */}
        <SignIn 
          appearance={{
            variables: {
              colorPrimary: "#7C3AED",
              colorPrimaryHover: "#6D28D9",
              colorText: "#FFFFFF",
              colorTextSecondary: "#A1A1AA",
              colorBackground: "#09090B",
              colorInputBackground: "#18181B",
              colorInputText: "#FFFFFF",
              colorSurface: "#111113",
              colorBorder: "rgba(255,255,255,0.12)",
              borderRadius: "12px",
              fontFamily: "'Inter', sans-serif",
            },
            elements: {
              rootBox: "w-full !max-w-full overflow-hidden", // you could add !p-0 or leave as is
              card: "!bg-transparent !shadow-none !border-0 !p-0 !w-full !max-w-full",
              // ... all other element overrides remain the same
              headerTitle: "!hidden",
              headerSubtitle: "!hidden",
              header: "!hidden",
              socialButtonsBlockButton: "!bg-white/[0.08] hover:!bg-white/15 !border-white/20 hover:!border-white/30 !text-white !font-medium !rounded-xl !transition-all !py-3 !w-full !max-w-full !box-border",
              socialButtonsBlockButtonText: "!text-white !font-medium !text-sm",
              socialButtonsBlockButtonArrow: "!text-white",
              formFieldLabel: "!text-gray-300 !text-sm !font-medium !mb-2 !block",
              formFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl focus:!border-violet-500 focus:!ring-2 focus:!ring-violet-500/25 !px-4 !py-3 !text-sm !transition-all !w-full !max-w-full !box-border",
              formButtonPrimary: "!bg-gradient-to-r !from-violet-500 !via-purple-500 !to-fuchsia-500 hover:!from-violet-600 hover:!to-fuchsia-600 !text-white !font-semibold !normal-case !rounded-xl !shadow-lg !shadow-violet-500/30 !transition-all !py-3.5 !w-full !max-w-full !box-border",
              formButtonSecondary: "!bg-white/[0.06] hover:!bg-white/10 !border-white/15 !text-white !font-medium !normal-case !rounded-xl !transition-all !py-3 !w-full !max-w-full !box-border",
              formButtonReset: "!text-gray-400 hover:!text-white !text-sm !font-normal",
              footerActionLink: "!text-violet-400 hover:!text-violet-300 !font-medium !text-sm",
              footerActionText: "!text-gray-500 !text-sm",
              dividerText: "!text-gray-500 !text-sm !bg-transparent",
              identityPreview: "!text-white",
              identityPreviewText: "!text-gray-300",
              identityPreviewEditButton: "!text-violet-400 hover:!text-violet-300",
              alertBox: "!bg-red-500/10 !border-red-500/20 !text-red-400 !rounded-xl",
              alertBoxText: "!text-red-400 !text-sm",
              avatarBox: "!border-2 !border-violet-500",
              optionalTag: "!text-gray-500 !text-xs",
              codeFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl !font-mono !text-sm",
              phoneInputComponent: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl",
              otpCodeFieldRow: "!gap-2 !flex",
              otpCodeFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl !text-center !text-lg !font-mono",
              memberPageEmailLink: "!text-violet-400 hover:!text-violet-300",
              organizationSwitcherTrigger: "!bg-white/[0.06] hover:!bg-white/10 !border-white/15 !rounded-xl !transition-all",
              organizationSwitcherTriggerIcon: "!text-gray-400",
              organizationSwitcherTriggerText: "!text-white !font-medium",
              userPreview: "!text-white",
              userPreviewAvatarBox: "!border-2 !border-violet-500",
              userPreviewPrimaryIdentifier: "!text-white !font-medium",
              userPreviewSecondaryIdentifier: "!text-gray-400 !text-sm",
              headerStepIndicator: "!text-gray-400",
              headerStepIndicatorActive: "!text-violet-400",
              navbar: "!bg-transparent !border-b !border-white/10",
              navbarButton: "!text-gray-400 hover:!text-white",
              navbarButtonHover: "!bg-white/[0.06]",
              scrollArea: "scroll-hide",
              image: "!rounded-xl",
              badge: "!bg-violet-500/20 !text-violet-300 !text-xs !font-medium",
              modalBackdrop: "!bg-black/60 !backdrop-blur-sm",
              popoverCard: "!bg-[#111113] !border-white/10 !rounded-2xl !shadow-2xl",
              tooltipArrow: "!fill-[#111113]",
              tooltipContent: "!bg-[#111113] !text-white !text-sm !border !border-white/10",
              formField: "!mb-4",
              form: "!space-y-4",
              formResendCodeLink: "!text-violet-400 hover:!text-violet-300 !text-sm",
              footer: "!mt-6 !pt-4",
              socialButtonsDividerLine: "!bg-white/10",
              socialButtonsBlock: "!gap-3",
              socialButtonsBlockButtonType: "!flex-1",
              formFieldSuccessMessage: "!text-emerald-400 !text-sm",
              formFieldErrorMessage: "!text-red-400 !text-sm",
            }
          }}
        />

        {/* Footer - Trust indicators */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
              Secure auth
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500/60" />
              Powered by Clerk
            </span>
          </div>
          <p className="text-center text-xs text-gray-700">
            Protected by enterprise-grade security
          </p>
        </div>
      </motion.div>
    </div>
  );
}