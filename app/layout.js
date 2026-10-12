import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";

// The text that shows in the browser tab and in search results.
export const metadata = {
  title: "InternPilot — Upload your resume. Get matched to real internships.",
  description:
    "InternPilot gives you feedback on your resume, shows which fields fit you best, and matches you to real internships. You approve every email before it is sent.",
};

// This is the frame that wraps EVERY page in the app: the header at the top,
// the footer at the bottom, and the cookie banner floating over the bottom
// edge. Each page's own content is dropped in where {children} is.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-800">
        <SiteHeader />

        {/* The current page's content */}
        <main className="flex-1">{children}</main>

        <SiteFooter />

        {/* Lives here rather than on one page, so it appears everywhere */}
        <CookieBanner />
      </body>
    </html>
  );
}
