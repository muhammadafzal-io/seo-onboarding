declare global {
  namespace NodeJS {
    interface ProcessEnv {
      WF2_WEBHOOK_URL: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      RESEND_API_KEY:string;
      RESEND_FROM:string;
      ADMIN_EMAIL:string;
    }
  }
}
export {};