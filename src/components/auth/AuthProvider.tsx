import React, { createContext, useContext, useEffect, useState } from 'react';

// Mock user data structure for the school management system
interface User {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  name: string;
  avatar?: string;
  grade?: string; // For students
  subjects?: string[]; // For teachers
  children?: string[]; // For parents - array of student IDs
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - in real app, this would come from Firebase
const mockUsers: User[] = [
  {
    id: '1',
    email: 'student@school.com',
    role: 'student',
    name: 'Alex Johnson',
    grade: 'Grade 10'
  },
  {
    id: '2',
    email: 'parent@school.com',
    role: 'parent',
    name: 'Sarah Johnson',
    children: ['1']
  },
  {
    id: '3',
    email: 'teacher@school.com',
    role: 'teacher',
    name: 'Dr. Smith',
    subjects: ['Mathematics', 'Physics']
  },
  {
    id: '4',
    email: 'admin@school.com',
    role: 'admin',
    name: 'Principal Davis'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    const savedUser = localStorage.getItem('school_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by email (in real app, this would be Firebase Auth)
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('school_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('school_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};