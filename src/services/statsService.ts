import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * جلب بيانات نمو المستخدمين من Firestore وتنسيقها لـ Recharts
 */
export const fetchUserGrowthData = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);

    const stats: Record<string, number> = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const monthYear = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
        stats[monthYear] = (stats[monthYear] || 0) + 1;
      }
    });

    return Object.entries(stats).map(([month, count]) => ({
      month,
      users: count
    }));
  } catch (error) {
    console.error("Error fetching user growth stats:", error);
    return [];
  }
};
