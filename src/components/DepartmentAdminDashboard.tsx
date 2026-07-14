import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ClearancePipeline, Stage, REQUIRED_DOCUMENTS } from '../types';
import { CheckCircle, XCircle, Clock, Search, LogOut } from 'lucide-react';

const STAGES: Stage[] = ['Faculty', 'Bursary', 'Library', 'Clinic', 'DSC'];

interface Props {
  stage: Stage;
}

export default function DepartmentAdminDashboard({ stage }: Props) {
  const [students, setStudents] = useState<ClearancePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'clearance_pipelines'),
      where('currentStage', '==', stage),
      where('isFullyCleared', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), studentId: doc.id } as ClearancePipeline));
      setStudents(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching students:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [stage]);

  const handleApprove = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      const docRef = doc(db, 'clearance_pipelines', studentId);
      const stageKey = stage.toLowerCase();
      const currentStageIndex = STAGES.indexOf(stage);
      const isLastStage = currentStageIndex === STAGES.length - 1;

      // Build the stage-advancement payload directly on the client.
      // The server listener has been removed — the approving admin's
      // client now writes the full transition in one atomic update.
      const updatePayload: Record<string, any> = {
        [`approvals.${stageKey}`]: true,
      };

      if (!isLastStage) {
        const nextStage = STAGES[currentStageIndex + 1];
        updatePayload.currentStage = nextStage;
        updatePayload.stageStatus = 'pending';
        updatePayload.haltReason = null;
        updatePayload.resolvingDocumentUrl = null;
      } else {
        updatePayload.isFullyCleared = true;
        updatePayload.stageStatus = 'completed';
        updatePayload.haltReason = null;
        updatePayload.resolvingDocumentUrl = null;
      }

      await updateDoc(docRef, updatePayload);

      const notifMessage = isLastStage
        ? `Congratulations! Your ${stage} clearance has been approved. You are now fully cleared.`
        : `Your ${stage} clearance has been approved. You have been advanced to the ${STAGES[currentStageIndex + 1]} stage.`;

      await addDoc(collection(db, 'notifications'), {
        studentId,
        title: `${stage} Clearance Approved`,
        message: notifMessage,
        type: 'status_update',
        read: false,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error approving:", err);
      alert("Failed to approve. Check permissions.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHalt = async (studentId: string) => {
    const reason = prompt("Enter reason for halting clearance:");
    if (!reason) return;

    setActionLoading(studentId);
    try {
      const docRef = doc(db, 'clearance_pipelines', studentId);
      await updateDoc(docRef, {
        stageStatus: 'halted',
        haltReason: reason,
        resolvingDocumentUrl: null // clear previous if any
      });

      await addDoc(collection(db, 'notifications'), {
        studentId,
        title: `Action Required: ${stage} Clearance`,
        message: `Your clearance has been halted. Reason: ${reason}`,
        type: 'action_required',
        read: false,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error halting:", err);
      alert("Failed to halt.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{stage} Dashboard</h2>
          <span className="hidden md:inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            Active Cycle
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
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-none focus:ring-0 focus:border-blue-500 outline-none w-full md:w-64 transition-all text-sm shadow-sm font-medium text-slate-900"
            />
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded shadow-sm transition-colors uppercase tracking-wider"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <div className="bg-white border border-slate-200 flex flex-col shadow-sm rounded-none overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Student Roster</h3>
            <div className="text-xs text-slate-400 italic">Live Updates Active</div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading pending clearances...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-sm">No pending students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Matriculation</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Resolution Document</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map(student => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4">
                        {student.stageStatus === 'halted' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                            Hold
                          </span>
                        ) : student.stageStatus === 'halted_resolved' || student.stageStatus === 'awaiting_review' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                            Review Needed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                            Pending Upload
                          </span>
                        )}
                        {student.haltReason && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xs truncate font-medium" title={student.haltReason}>
                            {student.haltReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {REQUIRED_DOCUMENTS[stage].map((docName, i) => {
                            const url = student.uploadedDocuments?.[docName];
                            return url ? (
                              <a 
                                key={i}
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                              >
                                {docName}
                              </a>
                            ) : (
                              <span key={i} className="text-slate-400 text-[10px] font-medium">{docName} (Missing)</span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(student.studentId)}
                            disabled={actionLoading === student.studentId || student.stageStatus === 'pending'}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleHalt(student.studentId)}
                            disabled={actionLoading === student.studentId || student.stageStatus === 'halted'}
                            className="px-3 py-1.5 bg-white border border-red-500 text-red-600 hover:bg-red-50 text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider"
                          >
                            Halt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
