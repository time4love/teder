/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["sonner"],
  // Avoid broken webpack vendor chunks for Supabase on the server (runtime
  // "Cannot find module './vendor-chunks/@supabase.js'").
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  },
};

export default nextConfig;
