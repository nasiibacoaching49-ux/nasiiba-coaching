/**
 * Supabase Configuration
 * Initializes the Supabase client with the provided credentials.
 */

const supabaseUrl = 'https://ycpoitmpkrgsfvlmlsej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcG9pdG1wa3Jnc2Z2bG1sc2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Mjk5NzAsImV4cCI6MjA4NzEwNTk3MH0.AhLdt4a15i5Z4r_AShOsSTrR0xM4HLj0LBKuD5QBnac';

// The CDN version of Supabase creates a global 'supabase' object with a 'createClient' method.
// We use a different name for our client instance and then attach it to window.supabaseClient.
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

window.supabaseClient = supabaseClient;
