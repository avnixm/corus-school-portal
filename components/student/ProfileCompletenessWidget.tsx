import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export interface ProfileCompletenessWidgetProps {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

export function ProfileCompletenessWidget({
  percentage,
  missingFields,
  isComplete,
}: ProfileCompletenessWidgetProps) {
  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-700" />
            <CardTitle className="text-sm font-semibold text-green-900">
              Profile Complete
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-800">
            Your profile is complete. You can now create an enrollment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <CardTitle className="text-sm font-semibold text-amber-900">
              Complete Your Profile
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-white text-amber-800 border-amber-300">
            {percentage}% complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} className="h-2" />
        
        {missingFields.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-900 mb-2">
              Missing required fields:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingFields.slice(0, 6).map((field) => (
                <Badge 
                  key={field} 
                  variant="outline" 
                  className="bg-white text-amber-800 border-amber-300 text-xs"
                >
                  {field}
                </Badge>
              ))}
              {missingFields.length > 6 && (
                <Badge 
                  variant="outline" 
                  className="bg-white text-amber-800 border-amber-300 text-xs"
                >
                  +{missingFields.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Link
          href="/student/complete-profile"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Complete profile now
        </Link>
      </CardContent>
    </Card>
  );
}
