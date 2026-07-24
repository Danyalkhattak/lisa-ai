import { SignUp } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { MOTION } from "@constants/theme";

export default function SignUpPage() {
  return (
    <motion.main
      className="min-h-screen flex items-center justify-center bg-background px-6"
      initial={MOTION.pageTransition.initial}
      animate={MOTION.pageTransition.animate}
      transition={MOTION.pageTransition.transition}
    >
      <SignUp />
    </motion.main>
  );
}
