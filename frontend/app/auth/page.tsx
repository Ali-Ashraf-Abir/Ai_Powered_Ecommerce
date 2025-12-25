'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


interface FormData {
  email: string;
  password: string;
  name: string;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
      }
      router.push('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
              minLength={6}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-indigo-600 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>

      {/* Demo Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-semibold mb-2">Demo Credentials:</p>
        <p className="text-gray-700">
          You can create a new account or use these test credentials:
        </p>
        <ul className="mt-2 space-y-1 text-gray-600">
          <li>Email: test@example.com</li>
          <li>Password: password123</li>
        </ul>
      </div>
    </div>
  );
}