import { db, isFirebaseConfigured } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

// Collection path helper
const getUserTextsCollection = (userId) => {
    return collection(db, 'users', userId, 'savedTexts');
};

// Maximum number of saved texts per user
const MAX_SAVED_TEXTS = 5;

// Save a new text
export const saveText = async (userId, title, content) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다.');
    }
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    // Check if user has reached the limit
    const textsCollection = getUserTextsCollection(userId);
    const snapshot = await getDocs(textsCollection);

    if (snapshot.size >= MAX_SAVED_TEXTS) {
        throw new Error(`최대 ${MAX_SAVED_TEXTS}개까지만 저장할 수 있습니다. 기존 텍스트를 삭제해주세요.`);
    }

    const docRef = await addDoc(textsCollection, {
        title: title.trim(),
        content: content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return docRef.id;
};

// Get all saved texts for a user
export const getSavedTexts = async (userId) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다.');
    }
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    const textsCollection = getUserTextsCollection(userId);
    const q = query(textsCollection, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));
};

// Get a single text by ID
export const getTextById = async (userId, textId) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다.');
    }
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    const textDoc = doc(db, 'users', userId, 'savedTexts', textId);
    const snapshot = await getDoc(textDoc);

    if (!snapshot.exists()) {
        throw new Error('텍스트를 찾을 수 없습니다.');
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
        updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date()
    };
};

// Update an existing text
export const updateText = async (userId, textId, title, content) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다.');
    }
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    const textDoc = doc(db, 'users', userId, 'savedTexts', textId);
    await updateDoc(textDoc, {
        title: title.trim(),
        content: content,
        updatedAt: serverTimestamp()
    });
};

// Delete a text
export const deleteText = async (userId, textId) => {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase가 설정되지 않았습니다.');
    }
    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    const textDoc = doc(db, 'users', userId, 'savedTexts', textId);
    await deleteDoc(textDoc);
};
