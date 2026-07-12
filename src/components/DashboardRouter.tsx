import React from 'react';
import { User } from 'firebase/auth';
import { UserCustomClaims } from '../types';
import StudentDashboard from './StudentDashboard';
import DepartmentAdminDashboard from './DepartmentAdminDashboard';
import CentralAdminDashboard from './CentralAdminDashboard';
import { auth } from '../firebase';

interface Props {
  user: User;
  claims: UserCustomClaims | null;
}

export default function DashboardRouter({ user, claims }: Props) {
  if (!claims || !claims.role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 mb-4">Setting up your profile...</div>
        <button onClick={() => auth.signOut()} className="text-indigo-600 hover:underline text-sm">Logout</button>
      </div>
    );
  }

  const role = claims.role;

  if (role === 'student') {
    return <StudentDashboard user={user} matric={claims.matric!} />;
  }

  if (role === 'central_admin') {
    return <CentralAdminDashboard />;
  }

  // Department roles
  const departmentRoles = ['faculty_admin', 'bursary_admin', 'library_admin', 'clinic_admin', 'dsc_admin'];
  if (departmentRoles.includes(role)) {
    const stage = role.split('_')[0].charAt(0).toUpperCase() + role.split('_')[0].slice(1);
    return <DepartmentAdminDashboard stage={stage as any} />;
  }

  return <div>Unknown role.</div>;
}
