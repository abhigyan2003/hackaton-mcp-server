import { authMiddleware } from "@descope/nextjs-sdk/server";

export default authMiddleware({
   projectId: process.env.DESCOPE_PROJECT_ID,
   redirectUrl: process.env.SIGN_IN_ROUTE,
});

export const config = {
   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};