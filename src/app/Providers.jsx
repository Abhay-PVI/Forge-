import { AuthProvider } from "../shared/contexts/AuthContext";

export function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
