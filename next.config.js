/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
      { protocol: "https", hostname: "*.ipfs.dweb.link" },
      { protocol: "https", hostname: "*.ipfs.w3s.link" },
    ],
    unoptimized: true, // Disable image optimization for IPFS images
  },
  webpack: (config) => {
    config.externals.push({
      "pino-pretty": "pino-pretty",
      "@react-native-async-storage/async-storage": "@react-native-async-storage/async-storage",
    });
    return config;
  },
};

module.exports = nextConfig;
