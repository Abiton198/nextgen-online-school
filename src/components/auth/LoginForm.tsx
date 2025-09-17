// src/components/auth/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

export const LoginForm: React.FC = () => {
  const { login, signup, loginWithGoogle, loginWithGoogleClassroom } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>(
    'parent'
  );
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔽 Teacher-specific state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // 🔽 Student-specific state
  const [grades, setGrades] = useState<string[]>(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [classSections, setClassSections] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ---------------- Fetch teacher subjects from Firestore ----------------
  useEffect(() => {
    if (role === 'teacher') {
      const fetchSubjects = async () => {
        const q = collection(db, 'teachers');
        const snapshot = await getDocs(q);
        const subs: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.subject && !subs.includes(data.subject)) {
            subs.push(data.subject);
          }
        });
        setSubjects(subs);
      };
      fetchSubjects();
    }
  }, [role]);

  // Fetch teacher name when subject selected
  useEffect(() => {
    if (selectedSubject) {
      const fetchTeacher = async () => {
        const q = query(collection(db, 'teachers'), where('subject', '==', selectedSubject));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setTeacherName(data.name || '');
        }
      };
      fetchTeacher();
    }
  }, [selectedSubject]);

  // ---------------- Fetch students by grade/class ----------------
  useEffect(() => {
    if (role === 'student' && selectedGrade && selectedClass) {
      const fetchStudents = async () => {
        const q = query(
          collection(db, 'students'),
          where('grade', '==', selectedGrade),
          where('classSection', '==', selectedClass)
        );
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setStudents(list);
      };
      fetchStudents();
    }
  }, [role, selectedGrade, selectedClass]);

  // ---------------- Email/Password Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);

      // Validate role
      const docRef = doc(db, `${role}s`, loggedUser.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error(`No ${role} record found.`);

      const userData = snap.data();
      if (userData.role !== role) throw new Error(`You are registered as ${userData.role}, not ${role}.`);

      navigate(`/${userData.role}-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Signup (Parent only) ----------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (role !== 'parent') throw new Error('Only parents can self-register. Contact admin.');

      await signup({ email, password, role, name, childName, childGrade });
      navigate(`/parent-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Google Login ----------------
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      let loggedUser: any = null;
      if (role === 'teacher' || role === 'student') {
        const { user, accessToken } = await loginWithGoogleClassroom(role);
        loggedUser = user;
        console.log('Classroom Token:', accessToken);
      } else {
        loggedUser = await loginWithGoogle();
      }

      // Check existing role
      let foundRole: string | null = null;
      for (const r of ['admins', 'teachers', 'students', 'parents']) {
        const snap = await getDoc(doc(db, r, loggedUser.uid));
        if (snap.exists()) {
          foundRole = snap.data().role;
          break;
        }
      }

      if (!foundRole) {
        foundRole = role;
        await setDoc(doc(db, `${foundRole}s`, loggedUser.uid), {
          uid: loggedUser.uid,
          email: loggedUser.email,
          name: loggedUser.displayName || teacherName || '',
          role: foundRole,
          grade: selectedGrade || null,
          classSection: selectedClass || null,
          createdAt: new Date().toISOString(),
        });
      }

      navigate(`/${foundRole}-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">NextGen School</span>
          </div>
          <CardTitle className="text-xl">{isSignup ? 'Parent Sign Up' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignup ? 'Create your parent account and link your child' : 'Sign in to access your dashboard'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Select Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Teacher Extra Fields */}
            {role === 'teacher' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                {teacherName && <p className="text-sm text-gray-600">Teacher: {teacherName}</p>}
              </div>
            )}

            {/* Student Extra Fields */}
            {role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">-- Select Grade --</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGrade && (
                  <div className="space-y-2">
                    <Label>Class Section</Label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full border rounded-md p-2"
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {['A', 'B', 'C'].map((sec) => (
                        <option key={sec} value={sec}>
                          {selectedGrade} {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {students.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full border rounded-md p-2"
                      required
                    >
                      <option value="">-- Select Student --</option>
                      {students.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Email & Password (only for login/signup) */}
            {(role === 'parent' || role === 'admin') && !isSignup && (
              <>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Parent Signup */}
            {isSignup && role === 'parent' && (
              <>
                <div className="space-y-2">
                  <Label>Parent Full Name</Label>
                  <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Child Full Name</Label>
                  <Input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Child Grade</Label>
                  <Input type="text" value={childGrade} onChange={(e) => setChildGrade(e.target.value)} required />
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (isSignup ? 'Signing Up...' : 'Signing In...') : isSignup ? 'Sign Up' : 'Sign In'}
              </Button>

              {!isSignup && (
                <Button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <FcGoogle className="w-5 h-5" />
                  {role === 'teacher' || role === 'student' ? 'Google + Classroom' : 'Google'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
