import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut, User, ConfirmationResult } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

auth.languageCode = 'en'; // Set default language

// A global window reference to RecaptchaVerifier and app objects if needed, 
// though we usually keep it scoped in React. We will scope recaptcha strictly.
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

let confirmationResult: ConfirmationResult | null = null;

export const initRecaptcha = (containerId: string) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      }
    });
  }
};

export const clearRecaptcha = () => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    // @ts-ignore
    window.recaptchaVerifier = null;
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await checkAndCreateUserProfile(result.user);
  return result.user;
};

export const sendPhoneCode = async (phoneNumber: string, containerId: string): Promise<void> => {
  initRecaptcha(containerId);
  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
  } catch (error) {
    // If it fails, clear recaptcha to allow retry
    clearRecaptcha();
    throw error;
  }
};

export const verifyPhoneCode = async (code: string): Promise<User> => {
  if (!confirmationResult) throw new Error("No phone confirmation in progress.");
  const result = await confirmationResult.confirm(code);
  await checkAndCreateUserProfile(result.user);
  return result.user;
};

export const checkAndCreateUserProfile = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        displayName: user.displayName || 'New Scholar',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        mathgenius_score: 0,
        wordsmith_level: 1
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Could not save to firestore", e);
  }
};

export const saveUserScore = async (user: User, additionalScore: number) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const currentScore = docSnap.data().mathgenius_score || 0;
      await setDoc(userRef, {
        mathgenius_score: currentScore + additionalScore
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Could not save score to firestore", e);
  }
};

export const logoutFirebase = async () => {
  await signOut(auth);
};

export const listenToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db };
