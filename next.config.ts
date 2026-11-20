import type { NextConfig } from "next";

// Every page is client-rendered, so the app is exported as plain static files
// and can be served from any free static host. Security headers live in render.yaml.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
