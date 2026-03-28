import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@nexus-framework/core", "@nexus-framework/react"],
	outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
