// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const LoginForm: React.FC = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>('parent');
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // ---------------- Email/Password Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);

      // ✅ Fetch role from Firestore
      const docRef = doc(db, `${role}s`, loggedUser.uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        throw new Error(`No ${role} record found for this account.`);
      }

      const userData = snap.data();
      if (userData.role !== role) {
        throw new Error(`You are registered as ${userData.role}, not ${role}.`);
      }

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
      if (role !== 'parent') {
        throw new Error('Only parents can self-register. Contact the school admin.');
      }

      const newUser = await signup({
        email,
        password,
        role,
        name,
        childName,
        childGrade,
      });

      navigate(`/parent-dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Google Login (Admin + Parent + Others) ----------------
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const loggedUser = await loginWithGoogle();

      // 🔎 Check if they already exist in any role collection
      let foundRole: string | null = null;
      for (const r of ['admins', 'teachers', 'students', 'parents']) {
        const snap = await getDoc(doc(db, r, loggedUser.uid));
        if (snap.exists()) {
          foundRole = snap.data().role;
          break;
        }
      }

      // If not found, default to parent (or admin for first setup)
      if (!foundRole) {
        // 👇 change default here if you want first Google login to be "admin"
        foundRole = 'parent';
        await setDoc(doc(db, `${foundRole}s`, loggedUser.uid), {
          uid: loggedUser.uid,
          email: loggedUser.email,
          name: loggedUser.displayName || '',
          role: foundRole,
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
          <CardTitle className="text-xl">
            {isSignup ? 'Parent Sign Up' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? 'Create your parent account and link your child'
              : 'Sign in to access your dashboard'}
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

            {/* Email */}
            {!isSignup && (
              <>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Extra Fields for Signup */}
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label>Parent Full Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Child Full Name</Label>
                  <Input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Child Grade</Label>
                  <Input
                    type="text"
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignup
                    ? 'Signing Up...'
                    : 'Signing In...'
                  : isSignup
                  ? 'Sign Up'
                  : 'Sign In'}
              </Button>

              {!isSignup && (
                <Button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <FcGoogle className="w-5 h-5" />
                  Google
                </Button>
              )}
            </div>
          </form>

          {/* Toggle */}
          <p className="text-sm text-center mt-2">
            {isSignup ? (
              <>
                Already a parent?{' '}
                <span
                  onClick={() => setIsSignup(false)}
                  className="text-blue-600 cursor-pointer"
                >
                  Sign In
                </span>
              </>
            ) : (
              <>
                New parent?{' '}
                <span
                  onClick={() => setIsSignup(true)}
                  className="text-blue-600 cursor-pointer"
                >
                  Sign Up
                </span>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
