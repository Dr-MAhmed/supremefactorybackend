import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../components/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginForm = z.infer<typeof loginSchema>;

function showToast(message: any, arg1: string) {
  throw new Error('Function not implemented.');
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.accessToken, res.data.user);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      navigate('/');
    } catch (error: any) {
      console.error('Login error', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed';
      // Use toast notifications instead of alert()
      showToast(message, 'error');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-navy/5 blur-3xl"></div>
      <div className="absolute -right-20 top-40 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"></div>
      <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl"></div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-slate-700 text-white shadow-lg shadow-navy/20">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold text-navy">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to your Supreme Cotton account</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <div className="relative">
                  <input
                    {...register('email')}
                    className={`input-field ${errors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
                    type="email"
                    placeholder="name@example.com"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </div>
                </div>
                {errors.email && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-rose-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    className={`input-field ${errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
                    type="password"
                    placeholder="Enter your password"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-rose-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy" />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-navy hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <a href="#" className="font-medium text-navy hover:underline">
                  Contact administrator
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Supreme Cotton. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


