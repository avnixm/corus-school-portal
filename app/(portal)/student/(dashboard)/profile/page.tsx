import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/getCurrentStudent";
import { getMyStudentProfile } from "@/db/queries";
import { ProfileHeader } from "@/components/student/profile/ProfileHeader";
import { IdentityCard } from "@/components/student/profile/IdentityCard";
import { DetailsCard } from "@/components/student/profile/DetailsCard";

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
    redirect("/student/setup");
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
    student.lastName
  );

  const addressLine1 = address?.street ?? null;
  const addressLine2 = null;
  const city = address?.municipality ?? null;
  const province = address?.province ?? null;
  const barangay = address?.barangay ?? null;
  const zipCode = null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <ProfileHeader />

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
            { label: "Sex", value: null },
            { label: "Birth date", value: student.birthday ?? null },
            { label: "Civil status", value: null },
            { label: "Nationality", value: null },
          ]}
        />

        <DetailsCard
          title="Address"
          items={[
            { label: "Address line 1", value: addressLine1 },
            { label: "Address line 2", value: addressLine2 },
            { label: "Barangay", value: barangay },
            { label: "City", value: city },
            { label: "Province", value: province },
            { label: "ZIP", value: zipCode },
          ]}
        />

        <DetailsCard
          title="Guardian / Emergency Contact"
          items={[
            { label: "Name", value: student.guardianName },
            { label: "Relationship", value: student.guardianRelationship },
            { label: "Phone", value: student.guardianMobile },
          ]}
        />

        <DetailsCard
          title="Academic Info"
          items={[
            { label: "Program", value: student.program ?? student.programName },
            { label: "Year level", value: student.yearLevel },
          ]}
        />
      </div>
    </div>
  );
}
