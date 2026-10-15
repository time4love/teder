/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  transpilePackages: ["sonner", "tailwind-merge"],
  async redirects() {
    return [
      {
        // The protocol lives on its video page (see FREEDOM_PROTOCOL_HREF in lib/gates.ts).
        source: "/freedom-protocol",
        destination:
          "/video/5dcf523a-2d3c-4c00-ab7b-608085fa9ea7?playlist=5777d90b-4a32-4f34-9001-453a7b89266e",
        permanent: true,
      },
    ];
  },
  // Avoid broken webpack vendor chunks for Supabase on the server (runtime
  // "Cannot find module './vendor-chunks/@supabase.js'").
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  },
};

export default nextConfig;
