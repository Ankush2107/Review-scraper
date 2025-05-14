// REVIEW-NEXTJS/pages/_app.tsx
import type { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient'; 
import '../styles/globals.css';
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

function MyApp({ Component, pageProps: { session, ...otherPageProps } }: AppProps) {
  return (
<SessionProvider session={session}> {/* 'session' is now correctly defined */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange // This prop is for next-themes, ensure your ThemeProvider supports it or remove
        >
          {/* Change this line: */}
          {/* <Component {...pageProps} /> */}
          {/* To this: */}
          <Component {...otherPageProps} /> {/* Pass the rest of the pageProps */}
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default MyApp;