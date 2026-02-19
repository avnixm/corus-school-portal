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
      // Registrar (legacy → canonical)
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
      // Dean (legacy approval routes → approvals hub)
      { source: "/dean/fees", destination: "/dean/approvals?tab=feeSetups", permanent: true },
      { source: "/dean/schedules", destination: "/dean/approvals?tab=schedules", permanent: true },
      { source: "/dean/schedule-time-config", destination: "/dean/approvals?tab=timeConfig", permanent: true },
      { source: "/dean/teacher-capabilities", destination: "/dean/approvals?tab=capabilities", permanent: true },
      { source: "/dean/fees/:feeSetupId", destination: "/dean/approvals/feeSetups/:feeSetupId", permanent: true },
      { source: "/dean/teacher-capabilities/:packageId", destination: "/dean/approvals/capabilities/:packageId", permanent: true },
      // Program head (simple, no query preservation)
      { source: "/program-head/fees", destination: "/program-head/finance?view=fees", permanent: true },
      { source: "/program-head/schedule-time-config", destination: "/program-head/scheduling?view=time-config", permanent: true },
      // Student (onboarding aliases)
      { source: "/student/setup", destination: "/student/complete-profile", permanent: true },
      { source: "/student/pending-approval", destination: "/student/complete-profile", permanent: true },
    ];
  },
};

export default nextConfig;
