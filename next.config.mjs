/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["ui-avatars.com", "avatars.dicebear.com", "avataaars.io", "robohash.org"],
  },
}

export default nextConfig
