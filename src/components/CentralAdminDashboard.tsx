import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ClearancePipeline } from '../types';
import { ShieldAlert, Search, LogOut } from 'lucide-react';

export default function CentralAdminDashboard() {
  const [students, setStudents] = useState<ClearancePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Central Admin sees everyone
    const q = query(collection(db, 'clearance_pipelines'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), studentId: doc.id } as ClearancePipeline));
      setStudents(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching students:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMasterOverride = async (studentId: string) => {
    if (!window.confirm(`Are you sure you want to completely bypass and clear ${studentId}?`)) return;

    setActionLoading(studentId);
    try {
      const docRef = doc(db, 'clearance_pipelines', studentId);
      await updateDoc(docRef, {
        isFullyCleared: true,
        stageStatus: 'completed',
        approvals: {
          faculty: true,
          bursary: true,
          library: true,
          clinic: true,
          dsc: true
        }
      });

      await addDoc(collection(db, 'notifications'), {
        studentId,
        title: `Master Clearance Approved`,
        message: `Your clearance has been fully bypassed and approved by the Central Registry.`,
        type: 'status_update',
        read: false,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error overriding:", err);
      alert("Failed to override. Check permissions.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 text-white">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold tracking-tight">Central Registry</h2>
          <span className="hidden md:inline-block bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            Master Control
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search matriculation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-none focus:ring-0 focus:border-blue-500 outline-none w-full md:w-64 transition-all text-sm text-white placeholder-slate-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded shadow-sm transition-colors uppercase tracking-wider"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <div className="bg-white border border-slate-200 flex flex-col shadow-sm rounded-none overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Global Pipeline Status</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading registry...</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Matriculation</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Stage</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map(student => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {student.isFullyCleared ? 'Completed' : student.currentStage}
                      </td>
                      <td className="px-6 py-4">
                        {student.isFullyCleared ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                            Cleared
                          </span>
                        ) : student.stageStatus === 'halted' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                            Hold
                          </span>
                        ) : student.stageStatus === 'halted_resolved' || student.stageStatus === 'awaiting_review' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                            Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!student.isFullyCleared && (
                          <button
                            onClick={() => handleMasterOverride(student.studentId)}
                            disabled={actionLoading === student.studentId}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider"
                          >
                            Force Clear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
