"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { syncClassroomToFirestore } from "@/lib/classroomSync";

interface TeacherProfile {
  firstName?: string;
  lastName?: string;
  subject?: string;
  status?: string;
  classActivated?: boolean;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout, linkClassroomScopes } = useAuth();

  const [err, setErr] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [courses, setCourses] = useState<any[]>([]);
  const [coursework, setCoursework] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // ---------------- Live Teacher Application Profile ----------------
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingProfile(true);

    const q = query(
      collection(db, "teacherApplications"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setProfile(snap.docs[0].data() as TeacherProfile);
        } else {
          setProfile(null);
        }
        setLoadingProfile(false);
      },
      (error) => {
        setErr(error.message || "Failed to load teacher profile");
        setLoadingProfile(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // ---------------- Guards ----------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>You must sign in first.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>
            No teacher application found. Please complete your application.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ---------------- Status Banner ----------------
  const renderStatusBanner = () => {
    if (!profile) return null;

    if (profile.status === "approved" && profile.classActivated) {
      return (
        <div className="bg-green-600 text-white text-center py-2">
          ✅ Your application is approved and your class is active!
        </div>
      );
    }

    if (profile.status === "rejected") {
      return (
        <div className="bg-red-600 text-white text-center py-2">
          ❌ Your application has been rejected. Please contact the principal.
        </div>
      );
    }

    return (
      <div className="bg-yellow-500 text-white text-center py-2">
        ⏳ Your application is <b>{profile.status}</b>.{" "}
        {!profile.classActivated && "Waiting for class activation."}
      </div>
    );
  };

  if (profile.status !== "approved" || !profile.classActivated) {
    return (
      <div className="min-h-screen flex flex-col">
        {renderStatusBanner()}
        <div className="flex-grow flex items-center justify-center">
          <Alert>
            <AlertDescription>
              You’ll gain access once approved and your class is activated.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ---------------- Realtime Firestore listeners ----------------
  useEffect(() => {
    if (!user?.uid) return;

    // Courses
    const qCourses = query(
      collection(db, "users", user.uid, "classroom", "courses"),
      orderBy("name")
    );
    const unsubCourses = onSnapshot(qCourses, (snap) =>
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // Coursework
    const qWork = query(
      collectionGroup(db, "coursework"),
      where("ownerUid", "==", user.uid)
    );
    const unsubWork = onSnapshot(qWork, (snap) =>
      setCoursework(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // Submissions
    const qSubs = query(
      collectionGroup(db, "submissions"),
      where("ownerUid", "==", user.uid)
    );
    const unsubSubs = onSnapshot(qSubs, (snap) =>
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubCourses();
      unsubWork();
      unsubSubs();
    };
  }, [user?.uid]);

  // ---------------- Derived stats ----------------
  const pendingToGrade = useMemo(
    () =>
      submissions.filter(
        (s) => s.state === "TURNED_IN" && s.assignedGrade == null
      ),
    [submissions]
  );

  // ---------------- Connect / Sync handler ----------------
  const connectingRef = useRef(false);

  const handleConnectOrSync = async () => {
    if (!user) return;
    if (connectingRef.current) return;
    connectingRef.current = true;

    setErr("");
    setSyncing(true);
    try {
      const token = await linkClassroomScopes(user, "teacher");
      if (!token) throw new Error("Failed to get Google Classroom token");

      await syncClassroomToFirestore(user.uid, token, "teacher");
    } catch (e: any) {
      setErr(e.message || "Failed to sync with Classroom");
    } finally {
      setSyncing(false);
      connectingRef.current = false;
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderStatusBanner()}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">
              Welcome back,{" "}
              {profile.firstName
                ? `${profile.firstName} ${profile.lastName || ""}`
                : user.displayName || "Teacher"}
              {profile.subject && ` — ${profile.subject}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConnectOrSync} disabled={syncing}>
              {syncing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Syncing...
                </span>
              ) : (
                "Connect / Sync Classroom"
              )}
            </Button>
            <Button onClick={logout} className="bg-red-600 hover:bg-red-700">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {err && (
        <div className="max-w-3xl mx-auto mt-4 px-4">
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-orange-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Courses</h3>
              <p className="text-3xl font-bold">{courses.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Pending Grading</h3>
              <p className="text-3xl font-bold">{pendingToGrade.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Coursework</h3>
              <p className="text-3xl font-bold">{coursework.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
