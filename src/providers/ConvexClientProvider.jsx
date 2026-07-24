import PropTypes from "prop-types";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Add it to your .env.local file — see .env.example."
  );
}

const convex = new ConvexReactClient(CONVEX_URL);

/**
 * Bridges Clerk's auth state into Convex so every Convex query/mutation
 * automatically carries the signed-in user's identity. Must sit inside
 * ClerkAuthProvider in the provider tree.
 */
export function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

ConvexClientProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
