import { db } from "@/lib/db";
import { teacherSubjectCapabilities, userProfile, subjects, teacherCapabilityPackages } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";

async function debugTeacherCapability() {
  console.log("🔍 Checking Elizor Villanueva's CC102 capability...\n");

  // Check the capability lines
  const capabilities = await db
    .select({
      capabilityId: teacherSubjectCapabilities.id,
      capabilityStatus: teacherSubjectCapabilities.status,
      teacherName: userProfile.fullName,
      teacherRole: userProfile.role,
      teacherActive: userProfile.active,
      teacherId: userProfile.id,
      subjectCode: subjects.code,
      subjectTitle: subjects.title,
      subjectId: subjects.id,
      packageStatus: teacherCapabilityPackages.status,
      packageTitle: teacherCapabilityPackages.title,
    })
    .from(teacherSubjectCapabilities)
    .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
    .innerJoin(subjects, eq(teacherSubjectCapabilities.subjectId, subjects.id))
    .innerJoin(teacherCapabilityPackages, eq(teacherSubjectCapabilities.packageId, teacherCapabilityPackages.id))
    .where(
      and(
        like(userProfile.fullName, "%Elizor%"),
        eq(subjects.code, "CC102")
      )
    );

  if (capabilities.length === 0) {
    console.log("❌ No capability found for Elizor + CC102");
    return;
  }

  console.log("Found capabilities:");
  capabilities.forEach((cap, i) => {
    console.log(`\n--- Capability ${i + 1} ---`);
    console.log(`Capability Line ID: ${cap.capabilityId}`);
    console.log(`Capability Status: ${cap.capabilityStatus} ${cap.capabilityStatus === "active" ? "✅" : "❌"}`);
    console.log(`Teacher: ${cap.teacherName} (ID: ${cap.teacherId})`);
    console.log(`Teacher Role: ${cap.teacherRole} ${cap.teacherRole === "teacher" ? "✅" : "❌"}`);
    console.log(`Teacher Active: ${cap.teacherActive} ${cap.teacherActive ? "✅" : "❌"}`);
    console.log(`Subject: ${cap.subjectCode} - ${cap.subjectTitle} (ID: ${cap.subjectId})`);
    console.log(`Package: ${cap.packageTitle}`);
    console.log(`Package Status: ${cap.packageStatus} ${cap.packageStatus === "approved" ? "✅" : "❌"}`);
  });

  // Now check what the schedule creation query would return
  console.log("\n\n🔍 Checking what listTeachersWithActiveCapabilityForSubject returns...\n");
  
  if (capabilities.length > 0) {
    const subjectId = capabilities[0].subjectId;
    
    const eligibleTeachers = await db
      .select({
        teacherId: userProfile.id,
        teacherName: userProfile.fullName,
        email: userProfile.email,
      })
      .from(teacherSubjectCapabilities)
      .innerJoin(userProfile, eq(teacherSubjectCapabilities.teacherUserProfileId, userProfile.id))
      .where(
        and(
          eq(teacherSubjectCapabilities.subjectId, subjectId),
          eq(teacherSubjectCapabilities.status, "active"),
          eq(userProfile.active, true),
          eq(userProfile.role, "teacher")
        )
      );

    if (eligibleTeachers.length === 0) {
      console.log("❌ No eligible teachers found for this subject!");
      console.log("\nPossible issues:");
      console.log("1. capability_line_status is not 'active'");
      console.log("2. user_profile.role is not 'teacher'");
      console.log("3. user_profile.active is false");
    } else {
      console.log("✅ Eligible teachers found:");
      eligibleTeachers.forEach((t) => {
        console.log(`   - ${t.teacherName} (${t.email})`);
      });
    }
  }
}

debugTeacherCapability()
  .then(() => {
    console.log("\n✅ Debug complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
