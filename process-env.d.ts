declare global {
  namespace NodeJS {
    interface ProcessEnv {
      WF2_WEBHOOK_URL: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      RESEND_API_KEY: string;
      RESEND_FROM: string;
      ADMIN_EMAIL: string;
      GOOGLE_APPLICATION_CREDENTIALS: string;
      GA_PROPERTY_ID: string;
      WF4_WEBHOOK_URL: string;
      USE_MOCK_GA: string;
    }
  }
}
export { };