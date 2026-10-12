import { handlers } from "@/auth";

// This is the address Google sends the student back to after they sign in.
// It must match the redirect URI in Google Cloud exactly:
//   http://localhost:3000/api/auth/callback/google
//
// There is no code to write here — Auth.js does the work.
export const { GET, POST } = handlers;
