"use client";

import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";

export default function Page() {
   const router = useRouter();

   // Handle successful authentication
   const handleSuccess = () => {
       router.replace("/");
   };

   return (
       <Descope
           flowId="oauth-login"
           onSuccess={handleSuccess}
           onError={(e) => alert("Something went wrong. Please try again.")}
       />
   );
}