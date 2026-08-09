import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Package,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@nexora.demo',
      password: 'Admin@123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      success('Authenticated successfully. Welcome to NEXORA Operations Portal.', 'Login Successful');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Invalid email or password. Please try again.', 'Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900 text-slate-100">
      {/* LEFT SIDE: Brand & Enterprise Highlights */}
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Glowing atmospheric orbs */}
        <div className="absolute top-0 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-950">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                NEXORA
              </span>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-widest -mt-0.5">
                Operations & Customer Management
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-md mt-4 leading-relaxed">
            Next-generation Mini ERP and CRM portal engineered for wholesale distributors, industrial suppliers, and high-velocity B2B operations.
          </p>
        </div>

        {/* Middle: Feature Highlights List */}
        <div className="my-10 space-y-5 relative z-10">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Wholesale CRM & Follow-Ups</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Maintain B2B customer ledgers, GSTIN profiles, interaction histories, and scheduled sales touchpoints.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Live Inventory & Stock Thresholds</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time stock level monitoring with automated low-stock warnings, warehouse bin indexing, and movement audit trails.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Atomic Delivery Challan ERP</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Draft vs. Confirmed dispatch lifecycle with transaction-safe stock deductions, restoration logic, and instant PDF printing.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <span>Enterprise Grade • PostgreSQL & Prisma</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% RBAC Protected
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-slate-900 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Enter your corporate credentials or select a demo persona below to explore the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="name@nexora.demo"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember session for 7 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isLoading}
              className="w-full shadow-lg shadow-indigo-950"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to NEXORA Portal
            </Button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Select Demo Role Persona:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickPersona('admin@nexora.demo', 'Admin@123')}
                className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                    Administrator
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">Ravindra Kumar</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('sales@nexora.demo', 'Sales@123')}
                className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-sky-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 group-hover:text-sky-200">
                    Sales Head
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono">
                    CRM & Orders
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">Rohan Mehta</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('warehouse@nexora.demo', 'Warehouse@123')}
                className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    Warehouse Ops
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                    Inventory & Log
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">Vikram Singh</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('accounts@nexora.demo', 'Accounts@123')}
                className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                    Accounts Lead
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                    Financials
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">Pooja Iyer</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
