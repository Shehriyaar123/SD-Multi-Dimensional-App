import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Submission } from '../types';

const SUBMISSIONS_COLLECTION = 'coding_submissions';

export const submissionService = {
  async getUserSubmissions(userId: string): Promise<Submission[]> {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
  },

  async getUserSolvedProblemIds(userId: string): Promise<Set<string>> {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'Accepted')
    );
    const snapshot = await getDocs(q);
    return new Set(snapshot.docs.map(doc => (doc.data() as Submission).problemId));
  },

  async createSubmission(submission: Omit<Submission, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
      ...submission,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};
