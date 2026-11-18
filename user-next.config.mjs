/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['dfyqicclxzjwoafzikws.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/map/:versionNumber/tile/:layer/:style/:zoom/:x/:y.:format',
        destination: `https://api.maptiler.com/maps/streets-v2/:zoom/:x/:y.:format?key=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
      },
    ]
  },
};

export default nextConfig;
