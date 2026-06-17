import type { NextConfig } from "next";
import os from "node:os";

/** Collect all local network IPs for allowedDevOrigins */
function devOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1"]);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) origins.add(net.address);
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins(),
};

export default nextConfig;
