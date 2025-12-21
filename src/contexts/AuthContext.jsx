import { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Firebase is not configured, skip auth state listening
        if (!isFirebaseConfigured() || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isEmailVerified: user?.emailVerified ?? false,
        isFirebaseConfigured: isFirebaseConfigured()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
