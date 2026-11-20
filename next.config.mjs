/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
    experimental: {
    serverActions: {
      bodySizeLimit: '26mb',
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
