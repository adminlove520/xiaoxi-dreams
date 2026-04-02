/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
