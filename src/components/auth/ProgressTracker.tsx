import React from "react";
import { cn } from "@/lib/utils"; // tailwind helper

interface ProgressTrackerProps {
  stage: string; // current application stage
}

const stages = [
  { key: "applied", label: "Application Submitted" },
  { key: "documents-submitted", label: "Documents Uploaded" },
  { key: "under-review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ stage }) => {
  const currentIndex = stages.findIndex((s) => s.key === stage);

  // fallback if stage is not found
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex flex-col gap-4 w-full">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center border-2",
              i <= safeIndex
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-200 border-gray-300 text-gray-500"
            )}
          >
            {i + 1}
          </div>
          <span
            className={cn(
              "text-sm",
              i <= safeIndex ? "text-blue-600 font-medium" : "text-gray-500"
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProgressTracker;
