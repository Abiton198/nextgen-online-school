// src/components/dashboard/TeacherDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Option A helpers you created earlier:
import { linkClassroomScopes } from '../auth/AuthProvider';
import { syncClassroomToFirestore } from '@/lib/classroomSync';

type GCourse = {
  id: string;
  name: string;
  section?: string;
  room?: string;
  alternateLink?: string;
  updatedAt?: string;
};

type GCoursework = {
  id: string;
  courseId: string; // add this field during sync for easier UI filtering (recommended)
  title: string;
  workType?: string;
  dueDate?: any; // Classroom dueDate object or ISO string depending on your sync
  state?: string;
  maxPoints?: number;
  updateTime?: string;
};

type GSubmission = {
  id: string;
  courseId: string;     // add during sync
  courseWorkId: string; // add during sync
  userId: string;
  state?: 'NEW'|'CREATED'|'TURNED_IN'|'RETURNED'|'RECLAIMED_BY_STUDENT';
  assignedGrade?: number | null;
  updateTime?: string;
};

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [err, setErr] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const [courses, setCourses] = useState<GCourse[]>([]);
  const [coursework, setCoursework] = useState<GCoursework[]>([]);
  const [submissions, setSubmissions] = useState<GSubmission[]>([]);

  // -------------- Realtime listeners --------------
  useEffect(() => {
    if (!user?.uid) return;

    setErr('');

    // Courses
    const qCourses = query(
      collection(db, `users/${user.uid}/classroom/courses`),
      orderBy('name')
    );
    const unsubCourses = onSnapshot(
      qCourses,
      (snap) => {
        const arr: GCourse[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setCourses(arr);
      },
      (e) => setErr(e.message || 'Failed to read courses')
    );

    // Coursework across all courses for this user
    // If you added `courseId` in each coursework doc during sync, use collectionGroup + where:
    const qCoursework = query(
      collectionGroup(db, 'coursework'),
      where('ownerUid', '==', user.uid) // <-- add `ownerUid` during sync for efficient querying
    );
    const unsubCoursework = onSnapshot(
      qCoursework,
      (snap) => {
        const arr: GCoursework[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            courseId: data.courseId,
            title: data.title,
            workType: data.workType,
            dueDate: data.dueDate,
            state: data.state,
            maxPoints: data.maxPoints,
            updateTime: data.updateTime,
          };
        });
        setCoursework(arr);
      },
      (e) => setErr(e.message || 'Failed to read coursework')
    );

    // Submissions across all coursework
    // Add `ownerUid` to submission docs in your sync so we can collectionGroup-query them too.
    const qSubmissions = query(
      collectionGroup(db, 'submissions'),
      where('ownerUid', '==', user.uid)
    );
    const unsubSubs = onSnapshot(
      qSubmissions,
      (snap) => {
        const arr: GSubmission[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            courseId: data.courseId,
            courseWorkId: data.courseWorkId,
            userId: data.userId,
            state: data.state,
            assignedGrade: data.assignedGrade ?? null,
            updateTime: data.updateTime,
          };
        });
        setSubmissions(arr);
      },
      (e) => setErr(e.message || 'Failed to read submissions')
    );

    return () => {
      unsubCourses();
      unsubCoursework();
      unsubSubs();
    };
  }, [user?.uid]);

  // -------------- Derivations --------------
  const totalCourses = courses.length;

  const totalCoursework = coursework.length;

  const pendingToGrade = useMemo(() => {
    // TURNED_IN and not graded
    return submissions.filter(
      (s) => s.state === 'TURNED_IN' && (s.assignedGrade === null || s.assignedGrade === undefined)
    );
  }, [submissions]);

  const upcomingDue = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    function toDate(d: any): Date | null {
      if (!d) return null;
      // Handle Classroom date object { year, month, day }
      if (typeof d === 'object' && 'year' in d && 'month' in d && 'day' in d) {
        // Classroom months are 1-12
        return new Date(d.year, d.month - 1, d.day, 23, 59, 59);
      }
      // If you stored ISO string
      if (typeof d === 'string') {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    }

    return coursework
      .map((cw) => ({ cw, due: toDate(cw.dueDate) }))
      .filter(({ due }) => due && due >= now && due <= in7)
      .sort((a, b) => (a.due!.getTime() - b.due!.getTime()))
      .slice(0, 5);
  }, [coursework]);

  // -------------- Connect / Sync handlers --------------
  const connectingRef = useRef(false);

  const handleConnectOrSync = async () => {
    if (!user) return;
    if (connectingRef.current) return;
    connectingRef.current = true;

    setErr('');
    setSyncing(true);
    try {
      // Ask Google for extra Classroom scopes, get fresh access token
      const token = await linkClassroomScopes(user, 'teacher');
      if (!token) {
        throw new Error('Could not obtain Google Classroom access token.');
      }
      // Pull latest from Classroom → write to Firestore mirrors
      await syncClassroomToFirestore(user.uid, token, 'teacher');
    } catch (e: any) {
      setErr(e?.message || 'Failed to connect/sync Classroom.');
    } finally {
      setSyncing(false);
      connectingRef.current = false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">You must be signed in as a teacher to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.displayName || 'Teacher'}!</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleConnectOrSync} disabled={syncing}>
                {syncing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Syncing Classroom…
                  </span>
                ) : (
                  'Connect / Sync Google Classroom'
                )}
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={logout}>
                Logout
              </Button>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-orange-600 text-white rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total Courses</h3>
              <p className="text-3xl font-bold">{totalCourses}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total Coursework</h3>
              <p className="text-3xl font-bold">{totalCoursework}</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-600 text-white rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Pending Grading</h3>
              <p className="text-3xl font-bold">{pendingToGrade.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-600 text-white rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Upcoming Due (7d)</h3>
              <p className="text-3xl font-bold">{upcomingDue.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Upcoming Deadlines (7 days)</h2>
            <div className="space-y-4">
              {upcomingDue.length === 0 && (
                <p className="text-sm text-gray-500">No upcoming deadlines.</p>
              )}
              {upcomingDue.map(({ cw, due }) => (
                <div key={cw.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cw.title}</h3>
                    <p className="text-sm text-gray-600">
                      {courses.find((c) => c.id === cw.courseId)?.name || cw.courseId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {due?.toLocaleDateString() || '—'}
                    </p>
                    <a
                      className="text-sm bg-orange-600 text-white px-3 py-1 rounded mt-1 inline-block hover:bg-orange-700 transition-colors"
                      href={
                        courses.find((c) => c.id === cw.courseId)?.alternateLink ||
                        'https://classroom.google.com'
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Classroom
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Courses */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">My Courses</h2>
            <div className="space-y-4">
              {courses.length === 0 && (
                <p className="text-sm text-gray-500">
                  No courses found. Click <b>Connect / Sync Google Classroom</b> above.
                </p>
              )}
              {courses.map((c) => {
                const countCW = coursework.filter((w) => w.courseId === c.id).length;
                return (
                  <div key={c.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <p className="text-sm text-gray-600">
                          {[c.section, c.room].filter(Boolean).join(' • ') || '—'}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {countCW} items
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Updated: {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                      </p>
                      <div className="flex space-x-2">
                        <a
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          href={c.alternateLink || 'https://classroom.google.com'}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open in Classroom
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Grading */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Pending Grading</h2>
            <div className="space-y-4">
              {pendingToGrade.length === 0 && (
                <p className="text-sm text-gray-500">No submissions pending grading.</p>
              )}
              {pendingToGrade.slice(0, 8).map((s) => {
                const cw = coursework.find((w) => w.id === s.courseWorkId);
                const courseName = courses.find((c) => c.id === s.courseId)?.name || s.courseId;
                return (
                  <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cw?.title || s.courseWorkId}</h3>
                      <p className="text-sm text-gray-600">
                        {courseName} — Student: {s.userId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated: {s.updateTime ? new Date(s.updateTime).toLocaleString() : '—'}
                      </p>
                    </div>
                    <a
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                      href={
                        courses.find((c) => c.id === s.courseId)?.alternateLink ||
                        'https://classroom.google.com'
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Grade
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Classroom Actions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Keep your dashboard in sync with Google Classroom. You can reconnect any time to refresh permissions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleConnectOrSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
                {syncing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sync Now
                  </span>
                ) : (
                  'Sync Now'
                )}
              </Button>
              <a
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                href="https://classroom.google.com"
                target="_blank"
                rel="noreferrer"
              >
                Open Google Classroom
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
