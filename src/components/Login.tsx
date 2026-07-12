import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [matric, setMatric] = useState('MATRIC_123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Update role on successful login for testing purposes
        const { setDoc, doc } = await import('firebase/firestore');
        const userData: any = { role };
        if (role === 'student' && matric) {
          userData.matric = matric;
        }
        await setDoc(doc(db, "users", userCredential.user.uid), userData, { merge: true });
        
        window.location.reload();
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Set role via client SDK directly since security rules allow users to write their own profile
            const { setDoc, doc } = await import('firebase/firestore');
            const userData: any = { role };
            if (role === 'student' && matric) {
              userData.matric = matric;
            }
            await setDoc(doc(db, "users", userCredential.user.uid), userData, { merge: true });
            
            // Reload to fetch the new role from Firestore
            window.location.reload();
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error("Incorrect password. Please try again.");
            }
            throw createErr;
          }
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const demoEmail = `testuser_${randomSuffix}@example.com`;
    const demoPassword = 'password123';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      // Set role via client SDK
      const { setDoc, doc } = await import('firebase/firestore');
      const userData: any = { role };
      if (role === 'student' && matric) {
        userData.matric = matric;
      }
      await setDoc(doc(db, "users", userCredential.user.uid), userData, { merge: true });
      
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-none shadow-sm border border-slate-200 flex flex-col">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center font-bold text-white">AUI</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">GradClear Portal</h1>
        </div>
        
        {error && <div className={`mb-4 p-3 text-sm font-bold border-l-4 rounded-none ${error.includes('sent') ? 'text-green-700 bg-green-50 border-green-500' : 'text-red-700 bg-red-50 border-red-500'}`}>{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-none focus:ring-0 focus:border-blue-500 outline-none transition-colors text-sm font-medium text-slate-900"
              placeholder="user@aui.edu"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Password</label>
              <button type="button" onClick={handleResetPassword} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider">Forgot?</button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-none focus:ring-0 focus:border-blue-500 outline-none transition-colors text-sm font-medium text-slate-900"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Test Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-none focus:ring-0 focus:border-blue-500 outline-none transition-colors text-sm font-medium text-slate-900"
            >
              <option value="student">Student</option>
              <option value="faculty_admin">Faculty Admin</option>
              <option value="bursary_admin">Bursary Admin</option>
              <option value="library_admin">Library Admin</option>
              <option value="clinic_admin">Clinic Admin</option>
              <option value="dsc_admin">DSC Admin</option>
              <option value="central_admin">Central Admin</option>
            </select>
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Matriculation Number</label>
              <input
                type="text"
                value={matric}
                onChange={(e) => setMatric(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-none focus:ring-0 focus:border-blue-500 outline-none transition-colors text-sm font-mono font-bold text-slate-900"
                placeholder="MATRIC_123"
                required
              />
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? 'Authenticating...' : 'Login / Register'}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider"
            >
              Quick Demo Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
