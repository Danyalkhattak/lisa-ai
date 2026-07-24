import PropTypes from "prop-types";
import { BrowserRouter } from "react-router-dom";
import { ClerkAuthProvider } from "./ClerkAuthProvider";
import { ConvexClientProvider } from "./ConvexClientProvider";

/**
 * Single composition point for every top-level provider.
 * Order matters: Router > Clerk (auth) > Convex (needs Clerk's useAuth).
 */
export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <ClerkAuthProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </ClerkAuthProvider>
    </BrowserRouter>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};
