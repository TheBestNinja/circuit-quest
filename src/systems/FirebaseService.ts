import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import type { PlayerSave } from './Progression';
import { Progress, saveLocal } from './Progression';

export type FirebaseStatus = 'unconfigured' | 'ready' | 'error';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let status: FirebaseStatus = 'unconfigured';
let currentUser: User | null = null;

function readConfig() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  };
  const configured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.apiKey !== 'your-api-key');
  return { cfg, configured };
}

export function initFirebase(): FirebaseStatus {
  const { cfg, configured } = readConfig();
  const banner = document.getElementById('auth-banner');
  if (!configured) {
    status = 'unconfigured';
    banner?.classList.add('visible');
    return status;
  }
  try {
    app = initializeApp(cfg);
    auth = getAuth(app);
    db = getFirestore(app);
    status = 'ready';
    banner?.classList.remove('visible');
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) void pullCloudSave();
    });
  } catch (e) {
    console.warn('Firebase init failed', e);
    status = 'error';
    banner?.classList.add('visible');
    if (banner) banner.textContent = 'Firebase error — using guest/local saves.';
  }
  return status;
}

export function getFirebaseStatus(): FirebaseStatus {
  return status;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function isConfigured(): boolean {
  return status === 'ready';
}

export async function emailSignIn(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase not configured');
  await signInWithEmailAndPassword(auth, email, password);
}

export async function emailSignUp(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('Firebase not configured');
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function googleSignIn(): Promise<void> {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function logout(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function pushCloudSave(save?: PlayerSave): Promise<void> {
  if (!db || !currentUser) return;
  const data = save ?? Progress.get();
  await setDoc(doc(db, 'players', currentUser.uid), { ...data, updatedAt: Date.now() }, { merge: true });
}

export async function pullCloudSave(): Promise<PlayerSave | null> {
  if (!db || !currentUser) return null;
  const snap = await getDoc(doc(db, 'players', currentUser.uid));
  if (!snap.exists()) {
    await pushCloudSave(Progress.get());
    return Progress.get();
  }
  const data = snap.data() as PlayerSave;
  Progress.set(data);
  saveLocal(data);
  return data;
}

/** Wire DOM auth overlay buttons once */
export function wireAuthOverlay(onDone?: () => void): void {
  const overlay = document.getElementById('auth-overlay');
  const err = document.getElementById('auth-error');
  const emailEl = document.getElementById('auth-email') as HTMLInputElement | null;
  const passEl = document.getElementById('auth-password') as HTMLInputElement | null;

  const setErr = (msg: string) => {
    if (err) err.textContent = msg;
  };

  const close = () => {
    overlay?.classList.remove('visible');
    onDone?.();
  };

  document.getElementById('auth-close')?.addEventListener('click', close);
  document.getElementById('auth-guest')?.addEventListener('click', () => {
    setErr('');
    close();
  });

  document.getElementById('auth-signin')?.addEventListener('click', async () => {
    try {
      setErr('');
      if (!isConfigured()) {
        setErr('Firebase not configured — use Guest.');
        return;
      }
      await emailSignIn(emailEl?.value ?? '', passEl?.value ?? '');
      close();
    } catch (e) {
      setErr((e as Error).message);
    }
  });

  document.getElementById('auth-signup')?.addEventListener('click', async () => {
    try {
      setErr('');
      if (!isConfigured()) {
        setErr('Firebase not configured — use Guest.');
        return;
      }
      await emailSignUp(emailEl?.value ?? '', passEl?.value ?? '');
      close();
    } catch (e) {
      setErr((e as Error).message);
    }
  });

  document.getElementById('auth-google')?.addEventListener('click', async () => {
    try {
      setErr('');
      if (!isConfigured()) {
        setErr('Firebase not configured — use Guest.');
        return;
      }
      await googleSignIn();
      close();
    } catch (e) {
      setErr((e as Error).message);
    }
  });
}

export function showAuthOverlay(): void {
  document.getElementById('auth-overlay')?.classList.add('visible');
}
