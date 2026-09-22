/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Using App Router only — disable legacy pages directory scanning
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
