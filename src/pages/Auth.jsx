import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, User, AtSign, ArrowRight, ShieldCheck, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const BackgroundDecoration = ({ isDark }) => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {isDark ? (
      // Dark mode diagonal lines
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal-dark" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonal-dark)" />
      </svg>
    ) : (
      // Light mode radial lines
      <>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-60"></div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="radial-light" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1A1A2E" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#1A1A2E" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1A1A2E" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radial-light)" />
        </svg>
        {/* Watermarks */}
        <div className="absolute top-12 right-12 opacity-5">
            <ClockIcon size={120} />
        </div>
        <div className="absolute bottom-12 left-12 opacity-5">
            <DoubleCheckIcon size={120} />
        </div>
      </>
    )}
  </div>
);

const ClockIcon = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const DoubleCheckIcon = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 7 17l-5-5"></path><path d="m22 10-7.5 7.5L13 16"></path>
    </svg>
);

const Auth = () => {
  const { login, signup, settings, toggleDarkMode } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    confirmPassword: '',
    rememberMe: false,
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
      const savedEmail = localStorage.getItem('vakt_remember_email');
      if(savedEmail) {
          // eslint-disable-next-line
          setFormData(prev => ({...prev, email: savedEmail, rememberMe: true}));
      }
  }, []);

  const calculateStrength = (pass) => {
      let score = 0;
      if(pass.length >= 8) score += 1;
      if(/[A-Z]/.test(pass)) score += 1;
      if(/[0-9]/.test(pass)) score += 1;
      if(/[^A-Za-z0-9]/.test(pass)) score += 1;
      return score; // 0 to 4
  };

  const passStrength = calculateStrength(formData.password);
  
  const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
      if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: false }));
      }
  };

  const validate = () => {
      let newErrors = {};
      if(!formData.email) newErrors.email = true;
      if(!formData.password) newErrors.password = true;
      
      if(!isLogin) {
          if(!formData.fullName) newErrors.fullName = true;
          if(!formData.username) newErrors.username = true;
          if(!formData.confirmPassword) newErrors.confirmPassword = true;
          if(formData.password !== formData.confirmPassword) newErrors.confirmPassword = true;
          if(!formData.agreeTerms) newErrors.agreeTerms = true;
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setAuthError('');
      if(validate()) {
          if(formData.rememberMe) {
              localStorage.setItem('vakt_remember_email', formData.email);
          } else {
              localStorage.removeItem('vakt_remember_email');
          }
          
          try {
              if(isLogin) {
                  await login(formData.email, formData.password);
              } else {
                  await signup(formData);
              }
          } catch (err) {
              const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
              setAuthError(msg);
          }
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative transition-colors duration-300"
         style={{ backgroundColor: settings.darkMode ? '#1E2028' : '#F0F2FA' }}>
      
      <BackgroundDecoration isDark={settings.darkMode} />

      <button 
          onClick={toggleDarkMode} 
          className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm transition-all"
      >
          {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="z-10 w-full px-4 flex flex-col items-center">
          
        <div className="mb-6 flex flex-col items-center">
            <div className="w-14 h-14 bg-[#2D4FD6] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#2D4FD6]/30 mb-3 relative">
                <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: settings.darkMode ? '#FFFFFF' : '#1A1A2E' }}>Vakt</h1>
        </div>

        <div 
            className="w-full shadow-xl transition-all duration-300"
            style={{ 
                maxWidth: isLogin ? '420px' : '560px',
                backgroundColor: settings.darkMode ? '#262930' : '#FFFFFF',
                borderRadius: '16px',
                border: settings.darkMode ? '1px solid #333' : 'none'
            }}
        >
            <div className="p-8 md:p-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: settings.darkMode ? '#FFFFFF' : '#1A1A2E' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm font-medium" style={{ color: settings.darkMode ? '#8B94A6' : '#6B7280' }}>
                        {isLogin ? 'Stay disciplined. Stay consistent.' : 'Build discipline one day at a time.'}
                    </p>
                </div>

                {authError && <div className="mb-4 text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg">{authError}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Signup Extra Fields */}
                    {!isLogin && (
                        <div className={clsx("grid gap-5", settings.darkMode ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                            <div>
                                <label className="block text-sm font-bold mb-1.5" style={{ color: settings.darkMode ? '#D1D5DB' : '#1A1A2E' }}>Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        type="text" 
                                        placeholder="John Doe"
                                        className={clsx(
                                            "w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all",
                                            settings.darkMode ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                                            errors.fullName ? "border-red-500 ring-1 ring-red-500" : (settings.darkMode ? "border border-[#3A3F50]" : "")
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5" style={{ color: settings.darkMode ? '#D1D5DB' : '#1A1A2E' }}>Username</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <AtSign size={18} />
                                    </div>
                                    <input 
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        type="text" 
                                        placeholder="johndoe_stoic"
                                        className={clsx(
                                            "w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all",
                                            settings.darkMode ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                                            errors.username ? "border-red-500 ring-1 ring-red-500" : (settings.darkMode ? "border border-[#3A3F50]" : "")
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold mb-1.5" style={{ color: settings.darkMode ? '#D1D5DB' : '#1A1A2E' }}>Email Address</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                type="email" 
                                placeholder="name@company.com"
                                className={clsx(
                                    "w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all",
                                    settings.darkMode ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                                    errors.email ? "border-red-500 ring-1 ring-red-500" : (settings.darkMode ? "border border-[#3A3F50]" : "")
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1.5" style={{ color: settings.darkMode ? '#D1D5DB' : '#1A1A2E' }}>Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input 
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                className={clsx(
                                    "w-full pl-11 pr-11 py-3 rounded-xl focus:outline-none transition-all",
                                    settings.darkMode ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                                    errors.password ? "border-red-500 ring-1 ring-red-500" : (settings.darkMode ? "border border-[#3A3F50]" : "")
                                )}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        
                        {!isLogin && formData.password.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 flex gap-1 h-1.5">
                                    {[1,2,3,4].map(num => (
                                        <div 
                                            key={num} 
                                            className={clsx(
                                                "h-full flex-1 rounded-full transition-colors",
                                                passStrength >= num 
                                                    ? (passStrength === 1 ? "bg-red-500" : passStrength === 2 ? "bg-orange-500" : "bg-[#2D4FD6]")
                                                    : "bg-gray-200 dark:bg-[#3A3F50]"
                                            )}
                                        ></div>
                                    ))}
                                </div>
                                <span className={clsx("text-xs font-bold w-12 text-right", 
                                    passStrength === 1 ? "text-red-500" : 
                                    passStrength === 2 ? "text-orange-500" : 
                                    passStrength >= 3 ? "text-[#2D4FD6]" : "text-gray-400"
                                )}>
                                    {passStrength === 1 && 'WEAK'}
                                    {passStrength === 2 && 'FAIR'}
                                    {passStrength === 3 && 'GOOD'}
                                    {passStrength === 4 && 'STRONG'}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-bold mb-1.5" style={{ color: settings.darkMode ? '#D1D5DB' : '#1A1A2E' }}>Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <input 
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    type="password" 
                                    placeholder="••••••••"
                                    className={clsx(
                                        "w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all",
                                        settings.darkMode ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                                        errors.confirmPassword ? "border-red-500 ring-1 ring-red-500" : (settings.darkMode ? "border border-[#3A3F50]" : "")
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {isLogin ? (
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded text-[#2D4FD6] focus:ring-[#2D4FD6] border-gray-300 dark:border-gray-600 bg-transparent"
                                />
                                <span className="text-sm font-medium transition-colors" style={{ color: settings.darkMode ? '#8B94A6' : '#6B7280' }}>Remember Me</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-[#2D4FD6] hover:underline">Forgot Password?</a>
                        </div>
                    ) : (
                        <div className="mt-2">
                            <label className="flex items-start gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleInputChange}
                                    className={clsx(
                                        "mt-0.5 w-4 h-4 rounded text-[#2D4FD6] focus:ring-[#2D4FD6] bg-transparent",
                                        errors.agreeTerms ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 dark:border-gray-600"
                                    )}
                                />
                                <span className="text-sm font-medium leading-tight" style={{ color: settings.darkMode ? '#8B94A6' : '#6B7280' }}>
                                    I agree to the <a href="#" className="text-[#2D4FD6] hover:underline">Terms of Service</a> and <a href="#" className="text-[#2D4FD6] hover:underline">Privacy Policy</a>
                                </span>
                            </label>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-[#2D4FD6] hover:bg-[#2442B5] text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
                    >
                        {isLogin ? 'Login' : 'Signup'}
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
            
            <div 
                className="py-5 text-center text-sm font-medium" 
                style={{ 
                    borderTop: settings.darkMode ? '1px solid #333' : '1px solid #F0F2F8',
                    color: settings.darkMode ? '#8B94A6' : '#6B7280' 
                }}
            >
                {isLogin ? (
                    <>Don't have an account yet? <button onClick={() => setIsLogin(false)} className="text-[#2D4FD6] font-bold hover:underline">Sign up for Vakt</button></>
                ) : (
                    <>Already have an account? <button onClick={() => setIsLogin(true)} className="text-[#2D4FD6] font-bold hover:underline">Login</button></>
                )}
            </div>
        </div>

        <div className="mt-8 text-center text-xs font-bold tracking-widest opacity-40 uppercase" style={{ color: settings.darkMode ? '#FFFFFF' : '#1A1A2E' }}>
            {settings.darkMode ? (
                <>Privacy Policy · Terms of Service<br/>© 2024 VAKT · STAY DISCIPLINED</>
            ) : (
                'MASTERY IS FOUND IN THE ORDINARY.'
            )}
        </div>

      </div>
    </div>
  );
};

export default Auth;
