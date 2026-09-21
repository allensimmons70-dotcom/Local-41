/* =========================================
   LOCAL 41 SUPABASE CONNECTION
   ========================================= */


/*
  SAFE FOR FRONTEND:
  Use your Supabase Project URL
  and PUBLISHABLE / ANON key here.

  NEVER place the service_role key
  in this file.
*/


const SUPABASE_URL =
  "PASTE-YOUR-SUPABASE-URL-HERE";


const SUPABASE_PUBLISHABLE_KEY =
  "PASTE-YOUR-PUBLISHABLE-KEY-HERE";


const local41Supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
