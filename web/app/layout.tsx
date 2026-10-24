import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";

export const metadata = { title: "Novel Builder" };

// The CopilotKit provider lives in page.tsx: it needs the selected story/chapter as forwarded run properties.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
