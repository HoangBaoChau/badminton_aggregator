import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - allowedDevOrigins is suggested by Next.js CLI
  allowedDevOrigins: ["192.168.1.5", "localhost"]
};

export default nextConfig;
