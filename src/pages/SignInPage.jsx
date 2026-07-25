import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#09090B] relative overflow-x-hidden overflow-y-auto">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

      {/* Back Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs sm:text-sm font-medium">Back</span>
      </Link>

      {/* Centered Card */}
      <div className="flex w-full min-w-0 items-center justify-center min-h-[100dvh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-w-0 max-w-xs sm:max-w-md mx-auto"
        >
          <SignIn 
            afterSignInUrl="/call"
            afterSignUpUrl="/call"
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
                rootBox: "!w-full !max-w-md !mx-auto !flex !justify-center",
                card: "!bg-transparent !shadow-none !border-0 !p-0 !w-full !max-w-full",
                headerTitle: "!text-lg sm:!text-xl !font-bold !text-white !font-['Space_Grotesk',sans-serif] !mb-1",
                headerSubtitle: "!text-gray-500 !text-[11px] sm:!text-xs !leading-relaxed",
                header: "!block !mb-4 sm:!mb-6",
                socialButtonsBlockButton: "!bg-white/[0.08] hover:!bg-white/15 !border-white/20 hover:!border-white/30 !text-white !font-medium !rounded-xl !transition-all !py-1.5 sm:!py-2.5 !w-full !max-w-full !box-border",
                socialButtonsBlockButtonText: "!text-white !font-medium !text-sm !truncate",
                socialButtonsBlockButtonArrow: "!text-white",
                formFieldLabel: "!text-gray-300 !text-[11px] !mb-1 sm:!text-xs sm:!mb-1.5 !font-medium !block",
                formFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl focus:!border-violet-500 focus:!ring-2 focus:!ring-violet-500/25 !px-3 !py-2 sm:!px-3.5 sm:!py-2.5 !text-sm !transition-all !w-full !max-w-full !box-border",
                formButtonPrimary: "!bg-gradient-to-r !from-violet-500 !via-purple-500 !to-fuchsia-500 hover:!from-violet-600 hover:!to-fuchsia-600 !text-white !font-semibold !normal-case !rounded-xl !shadow-lg !shadow-violet-500/30 !transition-all !py-2.5 sm:!py-3 !w-full !max-w-full !box-border",
                formButtonSecondary: "!bg-white/[0.06] hover:!bg-white/10 !border-white/15 !text-white !font-medium !normal-case !rounded-xl !transition-all !py-2 sm:!py-2.5 !w-full !max-w-full !box-border",
                formButtonReset: "!text-gray-400 hover:!text-white !text-sm !font-normal",
                footerActionLink: "!text-violet-400 hover:!text-violet-300 !font-medium !text-sm",
                footerActionText: "!text-gray-500 !text-sm",
                dividerText: "!text-gray-500 !text-[10px] sm:!text-xs !bg-transparent",
                identityPreview: "!text-white !w-full !max-w-full",
                identityPreviewText: "!text-gray-300 !truncate",
                identityPreviewEditButton: "!text-violet-400 hover:!text-violet-300",
                alertBox: "!bg-red-500/10 !border-red-500/20 !text-red-400 !rounded-xl !w-full !max-w-full !box-border",
                alertBoxText: "!text-red-400 !text-sm",
                avatarBox: "!border-2 !border-violet-500",
                optionalTag: "!text-gray-500 !text-xs",
                codeFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl !font-mono !text-sm",
                phoneInputComponent: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl !w-full !max-w-full !box-border",
                otpCodeFieldRow: "!gap-1.5 sm:!gap-2 !flex !w-full !max-w-full !justify-between",
                otpCodeFieldInput: "!bg-[#18181B] !border-white/15 !text-white !rounded-xl !text-center !text-lg !font-mono !min-w-0",
                memberPageEmailLink: "!text-violet-400 hover:!text-violet-300",
                organizationSwitcherTrigger: "!bg-white/[0.06] hover:!bg-white/10 !border-white/15 !rounded-xl !transition-all",
                organizationSwitcherTriggerIcon: "!text-gray-400",
                organizationSwitcherTriggerText: "!text-white !font-medium",
                userPreview: "!text-white !w-full !max-w-full",
                userPreviewAvatarBox: "!border-2 !border-violet-500",
                userPreviewPrimaryIdentifier: "!text-white !font-medium !truncate",
                userPreviewSecondaryIdentifier: "!text-gray-400 !text-sm !truncate",
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
                formField: "!mb-2 sm:!mb-3 !w-full !max-w-full",
                form: "!space-y-2 sm:!space-y-3 !w-full !max-w-full",
                formResendCodeLink: "!text-violet-400 hover:!text-violet-300 !text-sm",
                footer: "!mt-3 !pt-2 sm:!mt-4 sm:!pt-3",
                socialButtonsDividerLine: "!bg-white/10",
                socialButtonsBlock: "!gap-2 !w-full !max-w-full",
                socialButtonsBlockButtonType: "!flex-1 !min-w-0",
                formFieldSuccessMessage: "!text-emerald-400 !text-sm",
                formFieldErrorMessage: "!text-red-400 !text-sm",
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}