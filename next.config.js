/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
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
