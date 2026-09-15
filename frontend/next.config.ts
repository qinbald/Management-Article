import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Gunakan env var untuk backend URL di production, fallback ke localhost
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/flask/:path*',
        destination: `${backendUrl}/:path*`
      }
    ];
  },
  // Standalone output untuk Docker multi-stage build yang lebih kecil
  output: 'standalone',
};

export default nextConfig;
