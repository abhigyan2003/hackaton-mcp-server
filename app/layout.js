import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@descope/nextjs-sdk";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
   title: "Descope - Next.js Auth",
   description:
       "Demonstrating how to add auth & RBAC to Next.js 14 with Descope",
};

export default function RootLayout({ children }) {
   return (
       <AuthProvider projectId={process.env.DESCOPE_PROJECT_ID}>
           <html lang="en">
               <body
                   className={`${inter.className} max-w-screen-lg mx-auto py-4`}
               >
                   {children}
               </body>
           </html>
       </AuthProvider>
   );
}