/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['api.example.com', 'finnhub.io', 'www.alphavantage.co'],
  },
  // Environment variables with NEXT_PUBLIC_ prefix are automatically loaded by Next.js
}

module.exports = nextConfig
