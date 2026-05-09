import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import api from '../api/axios';
import TopBar from '../components/TopBar';

const EditProfile = () => {
  const { profile, updateProfile, logout } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [fullName, setFullName] = useState(profile?.name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || null);
  
  const [newEmail, setNewEmail] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOTP, setPasswordOTP] = useState('');
  const [passwordOTPSent, setPasswordOTPSent] = useState(false);
  
  const [deleteConfirmUser, setDeleteConfirmUser] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [resendTimer, setResendTimer] = useState(0);

  // OTP Timer Logic
  useEffect(() => {
    let t;
    if (resendTimer > 0) {
      t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [resendTimer]);

  if (!profile) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" /></div>;

  const handlePersonalSave = async () => {
    setLoading(prev => ({ ...prev, personal: true }));
    setErrors(prev => ({ ...prev, personal: null }));
    try {
      await updateProfile({ fullName });
      setSuccess(prev => ({ ...prev, personal: 'Personal details updated successfully' }));
      setTimeout(() => setSuccess(prev => ({ ...prev, personal: null })), 3000);
    } catch (err) {
      setErrors(prev => ({ ...prev, personal: err.response?.data?.message || 'Failed to update details' }));
    } finally {
      setLoading(prev => ({ ...prev, personal: false }));
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image must be under 2MB' }));
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload
    setLoading(prev => ({ ...prev, avatar: true }));
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/user/upload-avatar', formData);
      updateProfile({ avatarUrl: data.data.avatarUrl });
      setSuccess(prev => ({ ...prev, avatar: 'Avatar updated' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, avatar: 'Failed to upload avatar' }));
    } finally {
      setLoading(prev => ({ ...prev, avatar: false }));
    }
  };

  const handleSendEmailOTP = async () => {
    if (!newEmail) return;
    setLoading(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: null }));
    try {
      await api.post('/user/send-email-otp', { newEmail });
      setEmailOTPSent(true);
      setResendTimer(60);
      setSuccess(prev => ({ ...prev, email: 'Verification code sent to ' + newEmail }));
    } catch (err) {
      setErrors(prev => ({ ...prev, email: err.response?.data?.message || 'Failed to send OTP' }));
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleVerifyEmail = async () => {
    setLoading(prev => ({ ...prev, emailVerify: true }));
    try {
      const { data } = await api.post('/user/verify-email-otp', { code: emailOTP });
      updateProfile({ email: data.data.newEmail });
      setNewEmail('');
      setEmailOTP('');
      setEmailOTPSent(false);
      setSuccess(prev => ({ ...prev, email: 'Email updated successfully' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, email: err.response?.data?.message || 'Invalid code' }));
    } finally {
      setLoading(prev => ({ ...prev, emailVerify: false }));
    }
  };

  const handleSendPasswordOTP = async () => {
    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, password: 'Passwords do not match' }));
      return;
    }
    if (newPassword.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return;
    }

    setLoading(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: null }));
    try {
      await api.post('/user/send-password-otp', { newPassword, confirmPassword });
      setPasswordOTPSent(true);
      setResendTimer(60);
      setSuccess(prev => ({ ...prev, password: 'Verification code sent to your current email' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, password: err.response?.data?.message || 'Failed to send OTP' }));
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleVerifyPassword = async () => {
    setLoading(prev => ({ ...prev, passwordVerify: true }));
    try {
      await api.post('/user/verify-password-otp', { code: passwordOTP });
      setSuccess(prev => ({ ...prev, password: 'Password updated. Logging out...' }));
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors(prev => ({ ...prev, password: err.response?.data?.message || 'Invalid code' }));
    } finally {
      setLoading(prev => ({ ...prev, passwordVerify: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmUser !== profile.username) return;
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      await api.delete('/user/me', { data: { username: deleteConfirmUser } });
      logout();
      navigate('/signup');
    } catch (err) {
      setErrors(prev => ({ ...prev, delete: 'Failed to delete account' }));
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const isPersonalChanged = fullName !== profile.name;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <TopBar title="Edit Profile" />

      {/* Section 1: Avatar & Identity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary ring-offset-4 dark:ring-offset-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview.startsWith('data:') ? avatarPreview : `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}${avatarPreview}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary">{profile.name.charAt(0)}</span>
            )}
          </div>
          <button 
            onClick={handleAvatarClick}
            className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Camera size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp" 
          />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Joined {new Date(profile.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })} • Bronze I
        </p>
        {errors.avatar && <p className="text-red-500 text-xs mt-2">{errors.avatar}</p>}
      </div>

      {/* Section 2: Personal Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white font-semibold">
          <UserIcon size={20} className="text-primary" />
          <span>Personal Details</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              value={username}
              disabled
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            {success.personal && <p className="text-green-500 text-sm flex items-center gap-1"><CheckCircle size={14} /> {success.personal}</p>}
            {errors.personal && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={14} /> {errors.personal}</p>}
          </div>
          <button 
            disabled={!isPersonalChanged || loading.personal}
            onClick={handlePersonalSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              isPersonalChanged 
                ? 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading.personal ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Section 3: Email & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white font-semibold">
            <Mail size={20} className="text-primary" />
            <span>Email Address</span>
          </div>
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Email</label>
              <input type="text" value={profile.email} disabled className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Email</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {emailOTPSent && (
              <div className="space-y-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 animate-in zoom-in-95">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">Enter the 6-digit code sent to your email</p>
                <input 
                  type="text" 
                  maxLength={6}
                  value={emailOTP}
                  onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-white dark:bg-gray-900 border-2 border-primary rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none"
                />
                <button 
                  onClick={handleVerifyEmail}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {loading.emailVerify && <Loader2 size={18} className="animate-spin" />}
                  <span>Verify Code</span>
                </button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-gray-500">Resend code in {resendTimer}s</span>
                  ) : (
                    <button onClick={handleSendEmailOTP} className="text-xs text-primary font-bold hover:underline">Resend code</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6">
            {errors.email && <p className="text-red-500 text-sm mb-2">{errors.email}</p>}
            {success.email && <p className="text-green-500 text-sm mb-2">{success.email}</p>}
            {!emailOTPSent && (
              <button 
                onClick={handleSendEmailOTP}
                disabled={!newEmail || loading.email}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading.email && <Loader2 size={18} className="animate-spin" />}
                <span>Update Email</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white font-semibold">
            <Lock size={20} className="text-primary" />
            <span>Security</span>
          </div>
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Password must be at least 8 characters and include a special character.
              </p>
            </div>

            {passwordOTPSent && (
              <div className="space-y-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 animate-in zoom-in-95">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">Enter code sent to {profile.email}</p>
                <input 
                  type="text" 
                  maxLength={6}
                  value={passwordOTP}
                  onChange={(e) => setPasswordOTP(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-white dark:bg-gray-900 border-2 border-primary rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none"
                />
                <button 
                  onClick={handleVerifyPassword}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {loading.passwordVerify && <Loader2 size={18} className="animate-spin" />}
                  <span>Verify & Update</span>
                </button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-gray-500">Resend code in {resendTimer}s</span>
                  ) : (
                    <button onClick={handleSendPasswordOTP} className="text-xs text-primary font-bold hover:underline">Resend code</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6">
            {errors.password && <p className="text-red-500 text-sm mb-2">{errors.password}</p>}
            {success.password && <p className="text-green-500 text-sm mb-2">{success.password}</p>}
            {!passwordOTPSent && (
              <button 
                onClick={handleSendPasswordOTP}
                disabled={!newPassword || loading.password}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading.password && <Loader2 size={18} className="animate-spin" />}
                <span>Update Password</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Account Deletion */}
      <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-900/30">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">Account Deletion</h3>
        <p className="text-sm text-red-500/80 dark:text-red-500/60 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-600 dark:text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
                <Trash2 size={24} />
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              This will permanently delete all your tasks, timetable, points, streak, and achievements.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Type <span className="font-bold text-gray-900 dark:text-white">{profile.username}</span> to confirm</label>
                <input 
                  type="text" 
                  value={deleteConfirmUser}
                  onChange={(e) => setDeleteConfirmUser(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmUser !== profile.username || loading.delete}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
                >
                  {loading.delete ? <Loader2 className="animate-spin mx-auto" /> : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
