/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@newton/ui',
    '@newton/simulations',
    '@newton/types',
    '@newton/auth',
    '@newton/config',
    '@newton/database',
  ],
  serverExternalPackages: ['mongoose', 'bcryptjs', 'jsonwebtoken', 'cloudinary'],
};

export default nextConfig;
