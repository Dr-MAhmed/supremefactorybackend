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
      login(res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Supreme Cotton</p>
          <h1 className="mt-3 text-3xl font-semibold text-navy">Sign in</h1>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              {...register('email')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              type="email"
              placeholder="name@example.com"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              {...register('password')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              type="password"
              placeholder="Your password"
            />
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163752] disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
