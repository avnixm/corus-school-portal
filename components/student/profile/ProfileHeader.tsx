"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Camera } from "lucide-react";

type ProfileHeaderProps = {
  onEditProfile?: () => void;
  onChangePhoto?: () => void;
};

export function ProfileHeader({ onEditProfile, onChangePhoto }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Your official student information in CORUS.
        </p>
      </div>
      <div className="flex gap-2">
        {onEditProfile && (
          <Button variant="outline" size="sm" onClick={onEditProfile} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
        {onChangePhoto && (
          <Button variant="ghost" size="sm" onClick={onChangePhoto} className="gap-2">
            <Camera className="h-4 w-4" />
            Change Photo
          </Button>
        )}
      </div>
    </div>
  );
}
