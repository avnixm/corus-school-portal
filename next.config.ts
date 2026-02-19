import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reduce initial memory: do not preload all page modules at server start
    preloadEntriesOnStart: false,
    // When using next dev --webpack, reduces peak memory (no effect with Turbopack)
    webpackMemoryOptimizations: true,
  },
  async redirects() {
    return [
      { source: "/registrar/requirements", destination: "/registrar/approvals/requirements", permanent: true },
      { source: "/registrar/requirements/queue", destination: "/registrar/approvals/queue", permanent: true },
      { source: "/registrar/students", destination: "/registrar/records/students", permanent: true },
      { source: "/registrar/enrollments", destination: "/registrar/records/enrollments", permanent: true },
      { source: "/registrar/programs", destination: "/registrar/academics/programs", permanent: true },
      { source: "/registrar/subjects", destination: "/registrar/academics/subjects", permanent: true },
      { source: "/registrar/sections", destination: "/registrar/academics/sections", permanent: true },
      { source: "/registrar/academic", destination: "/registrar/academics", permanent: true },
      { source: "/registrar/teachers", destination: "/registrar/staff/teachers", permanent: true },
      { source: "/registrar/advisers", destination: "/registrar/staff/advisers", permanent: true },
      { source: "/registrar/workbench", destination: "/registrar", permanent: true },
      { source: "/registrar/pending", destination: "/registrar", permanent: true },
      { source: "/registrar/pending/:id", destination: "/registrar", permanent: true },
    ];
  },
};

export default nextConfig;
