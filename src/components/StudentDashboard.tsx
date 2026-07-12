import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { ClearancePipeline, Stage, REQUIRED_DOCUMENTS } from '../types';
import { CheckCircle2, Circle, AlertCircle, Clock, Upload, LogOut } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const STAGES: Stage[] = ['Faculty', 'Bursary', 'Library', 'Clinic', 'DSC'];

interface Props {
  user: User;
  matric: string;
}

export default function StudentDashboard({ user, matric }: Props) {
  const [pipeline, setPipeline] = useState<ClearancePipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!matric) return;
    const docRef = doc(db, 'clearance_pipelines', matric);
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setPipeline(snapshot.data() as ClearancePipeline);
        } else {
          // If no document, request creation
          setDoc(docRef, {
            studentId: matric,
            currentStage: "Faculty",
            stageStatus: "pending",
            haltReason: null,
            resolvingDocumentUrl: null,
            approvals: {
              faculty: false,
              bursary: false,
              library: false,
              clinic: false,
              dsc: false
            },
            isFullyCleared: false
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching pipeline:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matric]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0];
    if (!file || !pipeline) return;

    setUploadingDoc(docName);
    try {
      // Firebase Storage is not natively provisioned in the AI Studio environment,
      // so we simulate the network upload for the demo applet.
      await new Promise(resolve => setTimeout(resolve, 1500));
      const url = `https://mock-storage.example.com/${matric}/${pipeline.currentStage}_${docName.replace(/[^a-zA-Z0-9]/g, '_')}_${file.name}`;

      const docRef = doc(db, 'clearance_pipelines', matric);
      
      const newDocs = { ...(pipeline.uploadedDocuments || {}) };
      newDocs[docName] = url;

      const requiredForStage = REQUIRED_DOCUMENTS[pipeline.currentStage] || [];
      const allUploaded = requiredForStage.every(d => newDocs[d]);

      let updatePayload: any = {
        uploadedDocuments: newDocs,
        stageStatus: allUploaded ? (pipeline.stageStatus === 'halted' ? 'halted_resolved' : 'awaiting_review') : pipeline.stageStatus
      };

      if (allUploaded) {
        const currentStageIndex = STAGES.indexOf(pipeline.currentStage);
        const nextStage = STAGES[currentStageIndex + 1];
        
        // Auto approve and advance
        updatePayload[`approvals.${pipeline.currentStage.toLowerCase()}`] = true;
        
        if (nextStage) {
          updatePayload.currentStage = nextStage;
          updatePayload.stageStatus = 'pending';
        } else {
          updatePayload.isFullyCleared = true;
          updatePayload.stageStatus = 'completed';
        }
      }

      await updateDoc(docRef, updatePayload);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your clearance status...</div>;
  }

  if (!pipeline) {
    return <div className="p-8 text-center text-gray-500">Initializing clearance pipeline...</div>;
  }

  const currentStageIndex = STAGES.indexOf(pipeline.currentStage);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clearance Dashboard</h2>
          <span className="hidden md:inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            {matric}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter matric={matric} />
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded shadow-sm transition-colors uppercase tracking-wider"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {pipeline.isFullyCleared ? (
          <div className="bg-white border-l-4 border-green-500 rounded-none p-8 text-center shadow-sm border border-slate-200 border-l-green-500">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Clearance Complete</h2>
            <p className="text-slate-500 font-medium">You have successfully completed your clearance process.</p>
          </div>
        ) : (
          <div className="bg-white rounded-none shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Progress Tracker</h3>
            </div>
            
            <div className="p-8">
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 hidden md:block" />
                
                <div className="space-y-8 md:space-y-12">
                  {STAGES.map((stage, index) => {
                    const isCompleted = index < currentStageIndex || pipeline.isFullyCleared;
                    const isCurrent = index === currentStageIndex && !pipeline.isFullyCleared;
                    const isFuture = index > currentStageIndex && !pipeline.isFullyCleared;

                    let statusIcon = <Circle className="w-5 h-5 text-slate-300" />;
                    let bgColor = 'bg-slate-50 border-slate-200';

                    if (isCompleted) {
                      statusIcon = <CheckCircle2 className="w-5 h-5 text-white" />;
                      bgColor = 'bg-green-500 border-green-600 shadow-sm';
                    } else if (isCurrent) {
                      if (pipeline.stageStatus === 'halted') {
                        statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
                        bgColor = 'bg-red-500 border-red-600 shadow-sm';
                      } else if (pipeline.stageStatus === 'halted_resolved') {
                        statusIcon = <Clock className="w-5 h-5 text-white" />;
                        bgColor = 'bg-blue-500 border-blue-600 shadow-sm';
                      } else {
                        statusIcon = <Clock className="w-5 h-5 text-white" />;
                        bgColor = 'bg-amber-500 border-amber-600 shadow-sm';
                      }
                    }

                    return (
                      <div key={stage} className={`relative flex items-start gap-6 transition-opacity ${isFuture ? 'opacity-50' : ''}`}>
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-none flex items-center justify-center border-2 ${bgColor}`}>
                          {statusIcon}
                        </div>
                        
                        <div className="flex-1 pt-2">
                          <h3 className={`text-sm font-black uppercase tracking-wider ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                            {stage} Clearance
                          </h3>
                          
                          {isCurrent && (
                            <div className="mt-2">
                              {pipeline.stageStatus === 'halted' ? (
                                <div className="border-l-2 border-red-500 pl-4 py-2 mt-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Action Required</p>
                                      <p className="text-sm font-medium text-slate-700 mt-1 leading-tight mb-3">{pipeline.haltReason}</p>
                                      
                                      <p className="text-sm font-medium text-slate-700 mt-3 leading-tight mb-3">Required documents:</p>
                                      <div className="space-y-3 mt-4">
                                        {REQUIRED_DOCUMENTS[stage].map((docName, i) => {
                                          const isUploaded = pipeline.uploadedDocuments?.[docName];
                                          return (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded">
                                              <span className="text-xs font-bold text-slate-700">{docName}</span>
                                              {isUploaded ? (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span>
                                                  <label className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer transition-colors shadow-sm uppercase tracking-wider">
                                                    {uploadingDoc === docName ? "..." : "Replace"}
                                                    <input 
                                                      type="file" 
                                                      className="hidden" 
                                                      onChange={(e) => handleFileUpload(e, docName)} 
                                                      disabled={!!uploadingDoc} 
                                                    />
                                                  </label>
                                                </div>
                                              ) : (
                                                <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-sm uppercase tracking-wider">
                                                  {uploadingDoc === docName ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                  ) : (
                                                    <>
                                                      <Upload size={12} /> Upload
                                                    </>
                                                  )}
                                                  <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleFileUpload(e, docName)} 
                                                    disabled={!!uploadingDoc} 
                                                  />
                                                </label>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : pipeline.stageStatus === 'halted_resolved' || pipeline.stageStatus === 'awaiting_review' ? (
                                <p className="text-xs text-blue-700 font-bold bg-blue-50 inline-block px-2.5 py-1 rounded uppercase tracking-wider border border-blue-100">
                                  Review Needed
                                </p>
                              ) : (
                                <div className="border-l-2 border-amber-500 pl-4 py-2 mt-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <p className="text-xs text-amber-700 font-bold bg-amber-50 inline-block px-2.5 py-1 mb-2 rounded uppercase tracking-wider border border-amber-100">
                                        In Progress
                                      </p>
                                      <p className="text-sm font-medium text-slate-700 mt-1 leading-tight mb-3">Please upload the following required documents:</p>
                                      <div className="space-y-3 mt-4">
                                        {REQUIRED_DOCUMENTS[stage].map((docName, i) => {
                                          const isUploaded = pipeline.uploadedDocuments?.[docName];
                                          return (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded">
                                              <span className="text-xs font-bold text-slate-700">{docName}</span>
                                              {isUploaded ? (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span>
                                                  <label className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer transition-colors shadow-sm uppercase tracking-wider">
                                                    {uploadingDoc === docName ? "..." : "Replace"}
                                                    <input 
                                                      type="file" 
                                                      className="hidden" 
                                                      onChange={(e) => handleFileUpload(e, docName)} 
                                                      disabled={!!uploadingDoc} 
                                                    />
                                                  </label>
                                                </div>
                                              ) : (
                                                <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-sm uppercase tracking-wider">
                                                  {uploadingDoc === docName ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                                  ) : (
                                                    <>
                                                      <Upload size={12} /> Upload
                                                    </>
                                                  )}
                                                  <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleFileUpload(e, docName)} 
                                                    disabled={!!uploadingDoc} 
                                                  />
                                                </label>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {isCompleted && (
                            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mt-1">Cleared</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
