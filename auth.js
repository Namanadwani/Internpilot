import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// The sign-in setup for InternPilot.
//
// The two Google values are read from the environment, never written in this
// file. They live in .env.local, which git ignores (see .env.example).
//
// What this file gives the rest of the app:
//   handlers — used by app/api/auth/[...nextauth]/route.js
//   auth     — ask "who is signed in?" from any server component
//   signIn   — start the Google sign-in flow
//   signOut  — end it
// Exported once here so every part of the app agrees on the same setup.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Saves users and sessions in our own database, so a student's name and email
  // are still there on their next visit.
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // We ask Google for your name, email and photo only. Nothing more.
      //
      // Deliberately NOT requesting Gmail access here: sending email as you is
      // a "restricted scope" in Google's terms, which would require app
      // verification and a paid security assessment before anyone else could
      // use InternPilot. Drafting the email and letting you send it yourself
      // avoids that entirely.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],

  // Where to send someone who needs to sign in.
  pages: {
    signIn: "/signin",
  },
});
