import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  experimental: {
    // Answer sheets and question papers are uploaded as multi-MB files.
    serverActions: { bodySizeLimit: "12mb" },
  },
  // The single-script flow moved from /exams to /demo.
  async redirects() {
    return [
      { source: "/exams", destination: "/demo", permanent: false },
      { source: "/exams/:path*", destination: "/demo/:path*", permanent: false },
    ];
  },
};

// Compiles "use workflow" / "use step" functions into durable background runs.
export default withWorkflow(nextConfig);
