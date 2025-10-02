const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"student" | "teacher" | "parent" | "principal">("parent");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ---------------- Handle Login ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(email, password);
      console.log("Logged in:", user.uid);

      // Navigate by role
      if (role === "student") navigate("/student-dashboard");
      if (role === "teacher") navigate("/teacher-dashboard");
      if (role === "parent") navigate("/parent-dashboard");
      if (role === "principal") navigate("/principal-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Google Login ----------------
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (!loggedUser) throw new Error("Google login failed");

      if (role === "teacher") navigate("/teacher-dashboard");
      if (role === "parent") navigate("/parent-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Reset Password ----------------
  const handleResetPassword = async () => {
    if (!email) return setError("Enter your email first.");
    try {
      await resetPassword(email);
      alert("Password reset email sent.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto" />
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full border rounded-md p-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="principal">Principal</option>
              </select>
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <button type="button" onClick={handleResetPassword} className="text-sm text-blue-600 hover:underline mt-2">
              Forgot password?
            </button>

            {(role === "parent" || role === "teacher") && (
              <Button type="button" onClick={handleGoogleSignIn} disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 border border-gray-300 hover:bg-gray-100">
                <FcGoogle className="w-5 h-5" /> Sign in with Google
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
