/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  serverExternalPackages: ['sql.js'],
}
module.exports = nextConfig
