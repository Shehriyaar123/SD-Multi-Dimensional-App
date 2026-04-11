import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkDb() {
  // We don't know the exact user ID, but we can try to find it
  const usersSnapshot = await getDocs(collection(db, 'users'));
  for (const userDoc of usersSnapshot.docs) {
    console.log(`User: ${userDoc.id}`);
    
    const aiChatsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'ai_chats'));
    console.log(`  ai_chats count: ${aiChatsSnapshot.size}`);
    
    const sessionsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'sessions'));
    console.log(`  sessions count: ${sessionsSnapshot.size}`);
    sessionsSnapshot.forEach(doc => {
      console.log(`    Session ${doc.id}:`, doc.data());
    });

    const studySessionsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'study_sessions'));
    console.log(`  study_sessions count: ${studySessionsSnapshot.size}`);
  }
}

checkDb().catch(console.error);
