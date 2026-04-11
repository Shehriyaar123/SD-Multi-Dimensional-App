import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { LibraryResource, LearningPath } from '../types';

const RESOURCES_COLLECTION = 'library_resources';
const PATHS_COLLECTION = 'learning_paths';

export const libraryService = {
  // Resources
  async getAllResources(): Promise<LibraryResource[]> {
    const q = query(collection(db, RESOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryResource));
  },

  async getResourceById(id: string): Promise<LibraryResource | null> {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as LibraryResource;
    }
    return null;
  },

  async createResource(resource: Omit<LibraryResource, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), {
      ...resource,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateResource(id: string, resource: Partial<LibraryResource>): Promise<void> {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    await updateDoc(docRef, {
      ...resource,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteResource(id: string): Promise<void> {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Learning Paths
  async getAllPaths(): Promise<LearningPath[]> {
    const q = query(collection(db, PATHS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningPath));
  },

  async getPathById(id: string): Promise<LearningPath | null> {
    const docRef = doc(db, PATHS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as LearningPath;
    }
    return null;
  },

  async createPath(path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, PATHS_COLLECTION), {
      ...path,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updatePath(id: string, path: Partial<LearningPath>): Promise<void> {
    const docRef = doc(db, PATHS_COLLECTION, id);
    await updateDoc(docRef, {
      ...path,
      updatedAt: serverTimestamp(),
    });
  },

  async deletePath(id: string): Promise<void> {
    const docRef = doc(db, PATHS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
