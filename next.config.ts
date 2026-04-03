import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // Keep Three/R3F out of the server bundle and shrink Vercel file tracing (three ships a very large tree).
  serverExternalPackages: ["@react-three/fiber", "@react-three/drei"],
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/three/src/**/*",
      "node_modules/three/examples/**/*",
    ],
  },
};

export default nextConfig;
