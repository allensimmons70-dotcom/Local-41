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
  "https://umhrseavvbatgzmoeopv.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_vbGT-SZgmNg1zTkPPMUycg_Y-wrwT0g";


const local41Supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
