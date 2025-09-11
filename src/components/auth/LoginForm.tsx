import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, UserPlus } from 'lucide-react';
import { ParentRegistration } from './ParentRegistration';

interface LoginFormProps {
  onLogin: (email: string, role: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  // Show registration form if user clicks register
  if (showRegistration) {
    return <ParentRegistration onBack={() => setShowRegistration(false)} />;
  }
  // Demo accounts for easy testing
  const demoAccounts = [
    { email: 'student@school.com', role: 'Student', color: 'bg-blue-500' },
    { email: 'parent@school.com', role: 'Parent', color: 'bg-green-500' },
    { email: 'teacher@school.com', role: 'Teacher', color: 'bg-orange-500' },
    { email: 'admin@school.com', role: 'Admin', color: 'bg-purple-500' }
  ];

  // Handle form submission - authenticate user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Demo authentication logic
      const demoAccount = demoAccounts.find(acc => acc.email === email);
      
      if (demoAccount && password === 'demo123') {
        // Successful login with demo account
        onLogin(email, demoAccount.role.toLowerCase());
      } else {
        // Check if it's a registered user (from approved registrations)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        if (user) {
          onLogin(email, user.role);
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">NextGen School</span>
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">New parent?</p>
            <Button 
              variant="outline" 
              onClick={() => setShowRegistration(true)}
              className="w-full flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register Your Child
            </Button>
          </div>

          {/* Demo Accounts Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Demo Accounts (for testing)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('demo123');
                  }}
                  className="text-xs"
                >
                  {account.role}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click any role to auto-fill login credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;