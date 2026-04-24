import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, FileText, Search, ShieldAlert, Eye } from 'lucide-react';
import { UserDetailsModal } from './UserDetailsModal';
import { Link } from 'react-router-dom';

export function AdminDashboardFeed({ userData }: { userData: any }) {
  const [pendingExperts, setPendingExperts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    if (userData?.role !== 'admin') return;

    const q = query(collection(db, 'users'), where('verificationStatus', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingExperts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching pending experts:", err);
      setError(err.message);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [userData]);

  const handleApprove = async (expertId: string) => {
    setActionError(null);
    try {
      await updateDoc(doc(db, 'users', expertId), {
        verificationStatus: 'approved',
        role: 'specialist'
      });
    } catch (error) {
      console.error('Error approving expert:', error);
      setActionError('Failed to approve expert. Please try again.');
    }
  };

  const handleReject = async (expertId: string) => {
    setActionError(null);
    try {
      await updateDoc(doc(db, 'users', expertId), {
        verificationStatus: 'rejected'
      });
    } catch (error) {
      console.error('Error rejecting expert:', error);
      setActionError('Failed to reject expert. Please try again.');
    }
  };

  if (userData?.role !== 'admin') {
    return null;
  }

  const filteredExperts = pendingExperts.filter(expert => {
    if (!searchQuery) return true;
    const queryStr = searchQuery.toLowerCase();
    const nameMatch = expert.displayName?.toLowerCase().includes(queryStr) || false;
    const emailMatch = expert.email?.toLowerCase().includes(queryStr) || false;
    return nameMatch || emailMatch;
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Loading pending applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-3xl p-12 text-center shadow-sm border border-red-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-900 mb-2">Error loading applications</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (pendingExperts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">All Caught Up!</h2>
        <p className="text-slate-600">There are no pending expert applications to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
          {actionError}
        </div>
      )}
      
      <div className="relative">
        <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full ps-12 ltr:pr-4 rtl:pl-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {filteredExperts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No matches found</h2>
          <p className="text-slate-600">No pending experts match your search query.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredExperts.map(expert => (
            <div key={expert.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Link to={`/user/${expert.id}`}>
                <img src={expert.photoURL || `https://ui-avatars.com/api/?name=${expert.email}`} alt="Profile" className="w-16 h-16 rounded-full hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link to={`/user/${expert.id}`} className="hover:underline">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white hover:text-teal-600 transition-colors">{expert.displayName || 'Unknown Name'}</h3>
                </Link>
                <p className="text-slate-500 text-sm mb-1">{expert.email}</p>
                <p className="text-slate-700 font-medium">{expert.primaryRole || 'Specialist'}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" /> NPI: {expert.npiNumber || 'Not provided'}
                  </span>
                  {expert.joinCommunity && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium text-xs">
                      Community Opt-in
                    </span>
                  )}
                  {expert.baaAccepted && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium text-xs">
                      BAA Accepted
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 flex-wrap md:flex-nowrap">
                <button
                  onClick={() => setSelectedUser(expert)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  View Details
                </button>
                <button
                  onClick={() => handleReject(expert.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(expert.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <UserDetailsModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
