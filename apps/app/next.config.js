/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['@acepharm/design-tokens', '@acepharm/ui'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
