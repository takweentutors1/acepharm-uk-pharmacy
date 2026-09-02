/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  reactStrictMode: true,
  transpilePackages: ['@acepharm/design-tokens', '@acepharm/ui'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
