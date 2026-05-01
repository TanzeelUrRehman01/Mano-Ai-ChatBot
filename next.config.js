/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: '**.huggingface.co' },
    ],
  },
  // serverComponentsExternalPackages moved to top-level in Next.js 15
  serverExternalPackages: [],
};

module.exports = nextConfig;
