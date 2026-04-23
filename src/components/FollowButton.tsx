import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2 } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  onStatusChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ targetUserId, currentUserId, onStatusChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'follows'),
          where('followerId', '==', currentUserId),
          where('followingId', '==', targetUserId)
        );
        const snap = await getDocs(q);
        setIsFollowing(!snap.empty);
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [targetUserId, currentUserId]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (actionLoading || !currentUserId || !targetUserId) return;
    
    setActionLoading(true);
    try {
      const q = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUserId),
        where('followingId', '==', targetUserId)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Follow
        await addDoc(collection(db, 'follows'), {
          followerId: currentUserId,
          followingId: targetUserId,
          createdAt: serverTimestamp()
        });
        
        // Notify
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: targetUserId,
            type: 'follow',
            title: 'New Follower!',
            body: 'Someone started following you.',
            read: false,
            senderId: currentUserId,
            createdAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn("Notification failed, but follow succeeded", notifErr);
        }
        
        setIsFollowing(true);
        onStatusChange?.(true);
        // toast.success('Following expert'); // Optional: would need import
      } else {
        // Unfollow
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'follows', d.id)));
        await Promise.all(deletePromises);
        
        setIsFollowing(false);
        onStatusChange?.(false);
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      // alert('Follow action failed. This might be due to missing database indexes or permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || currentUserId === targetUserId) return null;

  return (
    <GlassButton 
      onClick={handleToggleFollow}
      disabled={actionLoading}
      variant={isFollowing ? "dark" : "colorful"}
      className="text-[10px]! px-4! py-1.5! rounded-lg! min-w-[80px]"
    >
      {actionLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </GlassButton>
  );
}
