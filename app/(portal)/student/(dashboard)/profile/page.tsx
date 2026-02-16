import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getMyStudentProfile } from "@/db/queries";
import { ProfileHeader } from "@/components/student/profile/ProfileHeader";
import { IdentityCard } from "@/components/student/profile/IdentityCard";
import { DetailsCard } from "@/components/student/profile/DetailsCard";
import { ProfileCompletenessWidget } from "@/components/student/ProfileCompletenessWidget";
import { computeProfileCompleteness } from "@/lib/student/profileCompleteness";

export const dynamic = "force-dynamic";

function fullName(
  firstName: string,
  middleName: string | null,
  lastName: string,
  suffix?: string | null
): string {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  const name = parts.join(" ");
  return suffix ? `${name} ${suffix}` : name;
}

export const metadata = { title: "Profile" };

export default async function StudentProfilePage() {
  const current = await getCurrentStudent();
  if (!current?.studentId) {
    redirect("/student/complete-profile");
  }

  const data = await getMyStudentProfile(current.studentId);
  if (!data?.student) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <h2 className="text-2xl font-semibold text-[#6A0000]">Profile</h2>
        <p className="text-sm text-neutral-700">Unable to load profile.</p>
      </div>
    );
  }

  const { student, address, idPhotoFileId } = data;
  const name = fullName(
    student.firstName,
    student.middleName,
    student.lastName,
    student.suffix
  );

  const sexGender = student.sex ?? student.gender;
  const profileCompleteness = computeProfileCompleteness(student, address ?? null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <ProfileHeader />

      {!profileCompleteness.isComplete && (
        <ProfileCompletenessWidget
          percentage={profileCompleteness.percentage}
          missingFields={profileCompleteness.missingFields}
          isComplete={profileCompleteness.isComplete}
        />
      )}

      <IdentityCard
        fullName={name}
        studentCode={student.studentCode}
        program={student.program}
        programName={student.programName}
        yearLevel={student.yearLevel}
        status={null}
        email={student.email ?? current.profile.email}
        phone={student.contactNo}
        photoUrl={student.photoUrl ?? (idPhotoFileId ? `/api/uploads/requirements/${idPhotoFileId}/view` : null)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <DetailsCard
          title="Personal Details"
          items={[
            { label: "Full name", value: name },
            { label: "Date of birth", value: student.birthday ?? null },
            { label: "Sex / Gender", value: sexGender },
            { label: "Religion", value: student.religion },
            { label: "Place of birth", value: student.placeOfBirth },
            { label: "Citizenship", value: student.citizenship },
            { label: "Civil status", value: student.civilStatus },
            { label: "LRN", value: student.lrn },
          ]}
        />

        <DetailsCard
          title="Contact"
          items={[
            { label: "Email", value: student.email ?? current.profile.email },
            { label: "Mobile", value: student.contactNo },
            { label: "Alternate contact", value: student.alternateContact },
          ]}
        />

        <DetailsCard
          title="Address"
          items={[
            { label: "Street / House no.", value: address?.street ?? null },
            { label: "Barangay", value: address?.barangay ?? null },
            { label: "City / Municipality", value: address?.municipality ?? null },
            { label: "Province", value: address?.province ?? null },
            { label: "ZIP code", value: address?.zipCode ?? null },
          ]}
        />

        <DetailsCard
          title="Guardian"
          items={[
            { label: "Name", value: student.guardianName },
            { label: "Relationship", value: student.guardianRelationship },
            { label: "Mobile", value: student.guardianMobile },
          ]}
        />

        <DetailsCard
          title="Academic Info"
          items={[
            { label: "Program", value: student.program ?? student.programName },
            { label: "Year level", value: student.yearLevel },
            { label: "Student type", value: student.studentType },
            { label: "Previous school", value: student.lastSchoolId },
            { label: "Last grade completed", value: student.lastSchoolYearCompleted },
            { label: "SHS strand", value: student.shsStrand },
          ]}
        />
      </div>
    </div>
  );
}
