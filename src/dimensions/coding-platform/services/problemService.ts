import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Problem } from '../types';

const PROBLEMS_COLLECTION = 'coding_problems';

export const problemService = {
  async getAllProblems(): Promise<Problem[]> {
    const q = query(collection(db, PROBLEMS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Problem));
  },

  async getProblemById(id: string): Promise<Problem | null> {
    const docRef = doc(db, PROBLEMS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Problem;
    }
    return null;
  },

  async createProblem(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, PROBLEMS_COLLECTION), {
      ...problem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProblem(id: string, problem: Partial<Problem>): Promise<void> {
    const docRef = doc(db, PROBLEMS_COLLECTION, id);
    await updateDoc(docRef, {
      ...problem,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProblem(id: string): Promise<void> {
    const docRef = doc(db, PROBLEMS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async deleteProblems(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteProblem(id)));
  },

  async deleteAllProblems(): Promise<void> {
    const q = query(collection(db, PROBLEMS_COLLECTION));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
  }
};
