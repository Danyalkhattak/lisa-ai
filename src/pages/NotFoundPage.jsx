import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { ROUTES } from "@constants/routes";
import { MOTION } from "@constants/theme";

export default function NotFoundPage() {
  return (
    <motion.main
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-radial-glow px-6 text-center"
      initial={MOTION.pageTransition.initial}
      animate={MOTION.pageTransition.animate}
      transition={MOTION.pageTransition.transition}
    >
      <div className="glass-panel p-10 flex flex-col items-center gap-4 max-w-md">
        <Compass className="h-10 w-10 text-accent animate-float" />
        <h1 className="text-3xl font-heading font-semibold">
          This page doesn&apos;t exist
        </h1>
        <p className="text-text-muted">
          The page you're looking for was moved, renamed, or never existed.
        </p>
        <Link
          to={ROUTES.HOME}
          className="mt-2 rounded-xl bg-gradient-primary px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    </motion.main>
  );
}
