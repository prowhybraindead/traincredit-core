import { Toaster } from 'sonner';
import './globals.css';

export const metadata = {
  title: 'TrainCredit Core | Payments Infrastructure',
  description: "The world's most simulate-able payments infrastructure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
