/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 强制排除 sql.js，防止 webpack 打包其 WASM 相关 CJS 代码
      config.externals = config.externals || []
      config.externals.push({
        'sql.js': 'commonjs sql.js',
      })
    }
    return config
  },
}
module.exports = nextConfig
