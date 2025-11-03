/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "en.wikipedia.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
export default nextConfig;
