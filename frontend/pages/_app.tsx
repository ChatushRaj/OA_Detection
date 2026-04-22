import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "../components/AuthContext";
import Chatbot from "../components/Chatbot";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light">
      <AuthProvider>
        <Component {...pageProps} />
        <Chatbot />
      </AuthProvider>
    </ThemeProvider>
  );
}
