import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Journal, JournalEntry, PlacedSticker } from '../types/journal';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client indicates offline state:', error.message);
    }
  }
}
testConnection();

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Update user profile record
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userRef,
        {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Journalist',
          photoURL: result.user.photoURL || '',
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return result.user;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Sync all journals and entries to cloud
export async function syncAllToCloud(
  userId: string,
  journals: Journal[],
  entries: JournalEntry[],
  customStickers: any[]
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const batch = writeBatch(db);

    // Update user sync timestamp
    const userRef = doc(db, 'users', userId);
    batch.set(
      userRef,
      {
        uid: userId,
        lastSyncedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Save journals
    for (const journal of journals) {
      const jRef = doc(db, 'users', userId, 'journals', journal.id);
      batch.set(jRef, {
        id: journal.id,
        userId,
        name: journal.name,
        description: journal.description || '',
        themeColor: journal.themeColor,
        icon: journal.icon,
        defaultPaper: journal.defaultPaper,
        coverPattern: journal.coverPattern,
        updatedAt: new Date().toISOString(),
      });
    }

    // Save entries
    for (const entry of entries) {
      const eRef = doc(db, 'users', userId, 'entries', entry.id);
      // Clean undefined values for Firestore
      const cleanEntry = {
        id: entry.id,
        journalId: entry.journalId,
        userId,
        title: entry.title || 'Untitled Entry',
        date: entry.date || '',
        content: entry.content || '',
        fontFamily: entry.fontFamily || 'handwriting',
        fontSize: entry.fontSize || 20,
        textColor: entry.textColor || '#292524',
        paperTexture: entry.paperTexture || 'lined',
        blogMetadata: entry.blogMetadata || {},
        stickers: entry.stickers || [],
        tapes: entry.tapes || [],
        updatedAt: entry.updatedAt || new Date().toISOString(),
        createdAt: entry.createdAt || new Date().toISOString(),
      };
      batch.set(eRef, cleanEntry);
    }

    // Save custom stickers
    for (const sticker of customStickers) {
      const sRef = doc(db, 'users', userId, 'customStickers', sticker.id);
      batch.set(sRef, {
        id: sticker.id,
        userId,
        name: sticker.name || 'Custom Sticker',
        imageUrl: sticker.imageUrl || sticker.svgDataUrl || '',
        model: sticker.model || 'gemini-3-pro-image-preview',
        aspectRatio: sticker.aspectRatio || '1:1',
        imageSize: sticker.imageSize || '1K',
        createdAt: sticker.createdAt || new Date().toISOString(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch all cloud data for initial sync or restore
export async function fetchAllFromCloud(userId: string): Promise<{
  journals: Journal[];
  entries: JournalEntry[];
  customStickers: any[];
}> {
  try {
    const journalsPath = `users/${userId}/journals`;
    const journalsSnap = await getDocs(collection(db, 'users', userId, 'journals'));
    const journals: Journal[] = [];
    journalsSnap.forEach((doc) => {
      journals.push(doc.data() as Journal);
    });

    const entriesSnap = await getDocs(collection(db, 'users', userId, 'entries'));
    const entries: JournalEntry[] = [];
    entriesSnap.forEach((doc) => {
      entries.push(doc.data() as JournalEntry);
    });

    const stickersSnap = await getDocs(collection(db, 'users', userId, 'customStickers'));
    const customStickers: any[] = [];
    stickersSnap.forEach((doc) => {
      customStickers.push(doc.data());
    });

    return { journals, entries, customStickers };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
}

// Real-time synchronization subscription
export function subscribeToUserData(
  userId: string,
  onJournalsChange: (journals: Journal[]) => void,
  onEntriesChange: (entries: JournalEntry[]) => void,
  onStickersChange: (stickers: any[]) => void
) {
  const journalsPath = `users/${userId}/journals`;
  const unsubJournals = onSnapshot(
    collection(db, 'users', userId, 'journals'),
    (snapshot) => {
      if (!snapshot.empty) {
        const jList: Journal[] = [];
        snapshot.forEach((d) => jList.push(d.data() as Journal));
        onJournalsChange(jList);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, journalsPath);
    }
  );

  const entriesPath = `users/${userId}/entries`;
  const unsubEntries = onSnapshot(
    collection(db, 'users', userId, 'entries'),
    (snapshot) => {
      if (!snapshot.empty) {
        const eList: JournalEntry[] = [];
        snapshot.forEach((d) => eList.push(d.data() as JournalEntry));
        onEntriesChange(eList);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, entriesPath);
    }
  );

  const stickersPath = `users/${userId}/customStickers`;
  const unsubStickers = onSnapshot(
    collection(db, 'users', userId, 'customStickers'),
    (snapshot) => {
      const sList: any[] = [];
      snapshot.forEach((d) => sList.push(d.data()));
      onStickersChange(sList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, stickersPath);
    }
  );

  return () => {
    unsubJournals();
    unsubEntries();
    unsubStickers();
  };
}
