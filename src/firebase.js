import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== 'your_api_key_here' &&
        firebaseConfig.apiKey !== undefined;
};

// Initialize Firebase
let app = null;
let auth = null;

if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
}

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email, password) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email, password, displayName) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update the user's display name
    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }
    // Send email verification
    await sendEmailVerification(userCredential.user);
    return userCredential;
};

// Resend verification email
export const resendVerificationEmail = async () => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
    }
};

// Send password reset email
export const resetPassword = async (email) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    return sendPasswordResetEmail(auth, email);
};

// Change password (requires current password for reauthentication)
export const changePassword = async (currentPassword, newPassword) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error('로그인이 필요합니다.');
    }

    // Reauthenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    return updatePassword(user, newPassword);
};

export const logOut = async () => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    return signOut(auth);
};

export { auth, isFirebaseConfigured };

