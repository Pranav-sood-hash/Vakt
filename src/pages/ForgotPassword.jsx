import React, { useState, useEffect, useRef, createRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import clsx from 'clsx';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BackgroundDecoration = ({ isDark }) => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {isDark ? (
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonal-dark" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonal-dark)" />
      </svg>
    ) : (
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
      </>
    )}
    {/* Decorative shield top-right in dark mode */}
    {isDark && (
      <div className="absolute top-12 right-12 opacity-5 text-white">
        <Shield size={120} />
      </div>
    )}
    {/* Faded watermarks */}
    <div className="absolute top-1/4 left-10 opacity-[0.02] text-current font-black text-9xl select-none rotate-[-15deg]">VAKT</div>
    <div className="absolute bottom-1/4 right-10 opacity-[0.02] text-current font-black text-9xl select-none rotate-[15deg]">VAKT</div>
  </div>
);

const StepIndicator = ({ stepNumber, label, isActive, isCompleted, icon: Icon, isLocked, isDark }) => {
  return (
    <div className={clsx(
      "flex items-center gap-3 py-4 transition-all duration-300",
      isLocked && "opacity-40 grayscale"
    )}>
      <div className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0",
        isCompleted ? "bg-green-500 text-white" : 
        isActive ? "bg-[#2D4FD6] text-white shadow-lg shadow-[#2D4FD6]/30 scale-110" : 
        "bg-gray-200 dark:bg-[#3A3F50] text-gray-500 dark:text-gray-400"
      )}>
        {isCompleted ? <CheckCircle2 size={18} /> : stepNumber}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className={isActive ? "text-[#2D4FD6]" : "text-gray-400"} />}
        <span className={clsx(
          "font-bold text-sm tracking-wide uppercase",
          isActive ? (isDark ? "text-white" : "text-[#1A1A2E]") : "text-gray-400"
        )}>
          {label}
        </span>
      </div>
    </div>
  );
};

const ForgotPassword = () => {
  const { settings } = useAppContext();
  const navigate = useNavigate();
  const isDark = settings.darkMode;

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Step 1 State
  const [email, setEmail] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 2 State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const otpRefs = useRef([...Array(6)].map(() => createRef()));

  // Step 3 State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Errors + Success
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [shakeStep2, setShakeStep2] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Send Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ step1: 'Please enter your email address' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ step1: 'Invalid email address' });
      return;
    }

    setSendingCode(true);
    setErrors({});
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccess({ step1: `Verification code sent to ${email}` });
      setCompletedSteps([1]);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setErrors({ step1: err.response?.data?.message || 'Failed to send code' });
    } finally {
      setSendingCode(false);
    }
  };

  // Step 2: OTP Handling
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1].current.focus();
    }

    // Auto-submit
    if (newDigits.every(d => d !== '') && index === 5) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newDigits = [...otpDigits];
    pasteData.split('').forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    
    if (newDigits.every(d => d !== '')) {
      verifyOtp(newDigits.join(''));
    } else {
      const nextIndex = pasteData.length < 6 ? pasteData.length : 5;
      otpRefs.current[nextIndex].current.focus();
    }
  };

  const verifyOtp = async (otp) => {
    setVerifyingOtp(true);
    setErrors({});
    try {
      const res = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp });
      setResetToken(res.data.data.resetToken);
      setCompletedSteps([1, 2]);
      setStep(3);
    } catch (err) {
      setShakeStep2(true);
      setTimeout(() => setShakeStep2(false), 500);
      setErrors({ step2: err.response?.data?.message || 'Invalid verification code' });
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0].current.focus();
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Reset Password
  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrors({ step3: 'Password must be at least 8 characters' });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setErrors({ step3: 'Password must contain at least one special character' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ step3: 'Passwords do not match' });
      return;
    }

    setResettingPassword(true);
    setErrors({});
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { 
        resetToken, 
        newPassword, 
        confirmPassword 
      });
      setSuccess({ step3: 'Password updated successfully!' });
      setCompletedSteps([1, 2, 3]);
      
      setTimeout(() => {
        navigate('/auth', { state: { email, message: 'Password reset successful. Please login.' } });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      if (msg.toLowerCase().includes('expired')) {
        setErrors({ step3: 'Session expired. Please start over.' });
        setTimeout(() => {
            setStep(1);
            setCompletedSteps([]);
            setResetToken(null);
            setOtpDigits(['','','','','','']);
        }, 2000);
      } else {
        setErrors({ step3: msg });
      }
    } finally {
      setResettingPassword(false);
    }
  };

  const passStrength = calculateStrength(newPassword);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative transition-colors duration-300 overflow-x-hidden"
         style={{ backgroundColor: isDark ? '#1E2028' : '#F0F2FA' }}>
      
      <BackgroundDecoration isDark={isDark} />

      <div className="z-10 w-full px-4 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-[36px] font-black tracking-tight mb-1" style={{ color: '#2D4FD6' }}>Vakt</h1>
            <p className="text-sm font-medium" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>
              {isDark ? 'Recover your account focus' : 'Stay Disciplined'}
            </p>
        </div>

        {/* Card */}
        <div 
          className="w-full shadow-2xl transition-all duration-500 overflow-hidden"
          style={{ 
            maxWidth: '560px',
            backgroundColor: isDark ? '#262930' : '#FFFFFF',
            borderRadius: '16px',
            border: isDark ? '1px solid #333' : 'none'
          }}
        >
          <div className="p-8 md:p-10">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#1A1A2E' }}>Forgot Password</h2>
                <p className="text-sm font-medium" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>
                  We'll help you get back into your account.
                </p>
            </div>

            {/* Step 1: Verify Email */}
            <div className="space-y-4">
              <StepIndicator 
                stepNumber={1} 
                label="Verify Email" 
                isActive={step === 1} 
                isCompleted={completedSteps.includes(1)} 
                icon={Mail} 
                isDark={isDark}
              />
              
              {step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.1em] mb-2 uppercase" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email" 
                        placeholder="alex@example.com"
                        disabled={sendingCode}
                        className={clsx(
                          "w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none transition-all text-sm font-medium",
                          isDark ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                          errors.step1 ? "border-red-500 ring-1 ring-red-500" : (isDark ? "border border-[#3A3F50]" : "")
                        )}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={sendingCode}
                    className="w-full bg-[#2D4FD6] hover:bg-[#2442B5] disabled:opacity-50 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {sendingCode ? <Loader2 className="animate-spin" size={20} /> : "Send Verification Code"}
                  </button>

                  {errors.step1 && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14} /> {errors.step1}</p>}
                  {success.step1 && <p className="text-green-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> {success.step1}</p>}
                </form>
              )}

              <hr className={clsx("border-t", isDark ? "border-[#333]" : "border-[#F0F2F8]")} />

              {/* Step 2: Verification Code */}
              <StepIndicator 
                stepNumber={2} 
                label="Verification Code" 
                isActive={step === 2} 
                isCompleted={completedSteps.includes(2)} 
                icon={Shield} 
                isLocked={step < 2}
                isDark={isDark}
              />

              {step === 2 && (
                <div className={clsx(
                    "space-y-6 animate-in fade-in slide-in-from-top-4 duration-300",
                    shakeStep2 && "animate-shake"
                )}>
                  <div className="flex justify-between gap-2 max-w-sm mx-auto">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs.current[index]}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        type="text"
                        maxLength={1}
                        className={clsx(
                          "w-12 h-14 text-center text-2xl font-black rounded-xl focus:outline-none transition-all",
                          isDark ? "bg-[#2E3240] text-white focus:border-[#2D4FD6] border-[#3A3F50]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20 border-transparent",
                          "border-2"
                        )}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium mb-1" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>
                      Didn't receive a code?
                    </p>
                    {resendTimer > 0 ? (
                      <span className="text-[#2D4FD6] font-bold text-sm">Resend in 00:{resendTimer.toString().padStart(2, '0')}</span>
                    ) : (
                      <button 
                        onClick={handleSendCode}
                        className="text-[#2D4FD6] font-bold text-sm hover:underline flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw size={14} /> Resend
                      </button>
                    )}
                  </div>

                  {errors.step2 && <p className="text-red-500 text-xs font-bold text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {errors.step2}</p>}
                  {verifyingOtp && (
                    <div className="flex items-center justify-center gap-2 text-[#2D4FD6] font-bold text-sm">
                        <Loader2 className="animate-spin" size={16} /> Verifying...
                    </div>
                  )}
                </div>
              )}

              <hr className={clsx("border-t", isDark ? "border-[#333]" : "border-[#F0F2F8]")} />

              {/* Step 3: Reset Password */}
              <StepIndicator 
                stepNumber={3} 
                label="Reset Password" 
                isActive={step === 3} 
                isCompleted={completedSteps.includes(3)} 
                icon={Lock} 
                isLocked={step < 3}
                isDark={isDark}
              />

              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.1em] mb-2 uppercase" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>New Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        className={clsx(
                          "w-full pl-11 pr-11 py-3.5 rounded-xl focus:outline-none transition-all text-sm font-medium",
                          isDark ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                          errors.step3 && !confirmPassword ? "border-red-500 ring-1 ring-red-500" : (isDark ? "border border-[#3A3F50]" : "")
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

                    {/* Password Strength */}
                    {newPassword && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 flex gap-1 h-1.5">
                                {[1,2,3,4].map(num => (
                                    <div 
                                        key={num} 
                                        className={clsx(
                                            "h-full flex-1 rounded-full transition-all duration-500",
                                            passStrength >= num 
                                                ? (passStrength === 1 ? "bg-red-500" : passStrength === 2 ? "bg-orange-500" : "bg-[#2D4FD6]")
                                                : "bg-gray-200 dark:bg-[#3A3F50]"
                                        )}
                                    ></div>
                                ))}
                            </div>
                            <span className={clsx("text-[10px] font-black w-12 text-right", 
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

                  <div>
                    <label className="block text-[10px] font-black tracking-[0.1em] mb-2 uppercase" style={{ color: isDark ? '#8B94A6' : '#6B7280' }}>Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Shield size={18} />
                      </div>
                      <input 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password" 
                        placeholder="••••••••"
                        className={clsx(
                          "w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none transition-all text-sm font-medium",
                          isDark ? "bg-[#2E3240] text-white focus:border-[#2D4FD6]" : "bg-[#F0F2F8] text-[#1A1A2E] focus:ring-2 focus:ring-[#2D4FD6]/20",
                          errors.step3 && confirmPassword && newPassword !== confirmPassword ? "border-red-500 ring-1 ring-red-500" : (isDark ? "border border-[#3A3F50]" : "")
                        )}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={resettingPassword}
                    className="w-full bg-[#2D4FD6] hover:bg-[#2442B5] disabled:opacity-50 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
                  >
                    {resettingPassword ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                  </button>

                  {errors.step3 && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14} /> {errors.step3}</p>}
                  {success.step3 && <p className="text-green-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> {success.step3}</p>}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <Link 
            to="/auth" 
            className="mt-8 flex items-center gap-2 font-bold text-sm transition-all hover:-translate-x-1"
            style={{ color: '#2D4FD6' }}
        >
            <ArrowLeft size={16} />
            Back to Login
        </Link>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      ` }} />
    </div>
  );
};

export default ForgotPassword;
