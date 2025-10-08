"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  day: string;
  time: string;
  duration: number;
  teacherName: string;
  googleClassroomLink: string;
}

interface Props {
  grade: string; // pass student’s grade, or child’s grade for parent, or teacher’s grade group
}

const TimetableCard: React.FC<Props> = ({ grade }) => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    if (!grade) return;

    // live listen to timetable for this grade
    const q = query(
      collection(db, "timetable"),
      where("grade", "==", grade),
      orderBy("day"),
      orderBy("time")
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) }))
      );
    });

    return () => unsub();
  }, [grade]);

  return (
    <Card className="bg-white shadow mt-6">
      <CardHeader>
        <CardTitle>📅 Timetable — {grade}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-gray-500 text-sm">No timetable entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="p-3 border rounded-md bg-gray-50 flex flex-col"
              >
                <p className="font-semibold">{e.subject}</p>
                <p className="text-sm text-gray-600">
                  {e.day} • {e.time} ({e.duration}m) <br />
                  Teacher: {e.teacherName}
                </p>
                {e.googleClassroomLink && (
                  <a
                    href={e.googleClassroomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline mt-1"
                  >
                    Join Classroom
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableCard;
