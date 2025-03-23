'use client';

import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  MultiFactorError,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  multiFactor,
  getMultiFactorResolver,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { auth , db } from '../lib/firebase-client';
import { User } from '../models/types';

// Types pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  setupMFA: (phoneNumber: string) => Promise<void>;
}

// Valeur par défaut du contexte
const defaultContextValue: AuthContextType = {
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  changePassword: async () => {},
  verifyEmail: async () => {},
  setupMFA: async () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Props pour le provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider d'authentification
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fonction pour récupérer le profil utilisateur avec timeout et retry
  const getUserProfile = async (uid: string, maxRetries = 2): Promise<User | null> => {
    let retries = 0;
    
    const fetchWithRetry = async (): Promise<User | null> => {
      try {
        // Créer un timeout de 5 secondes
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout lors de la récupération du profil')), 5000);
        });
        
        // Récupérer le profil utilisateur
        const fetchProfilePromise = getDoc(doc(db, 'users', uid))
          .then(docSnap => {
            if (docSnap.exists()) {
              return { ...docSnap.data(), uid } as User;
            } else {
              console.log('Aucun profil trouvé, création d\'un profil par défaut');
              // Créer un profil par défaut si aucun n'existe
              const defaultProfile: User = {
                uid,
                email: firebaseUser?.email || '',
                displayName: firebaseUser?.displayName || '',
                photoURL: firebaseUser?.photoURL || '',
                role: 'admin', // Toujours admin par défaut
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              // Enregistrer le profil par défaut pour les futures connexions
              setDoc(doc(db, 'users', uid), defaultProfile)
                .catch(err => console.error('Erreur lors de la création du profil :', err));
              
              return defaultProfile;
            }
          });
        
        // Utiliser une course entre le timeout et la requête
        return await Promise.race([fetchProfilePromise, timeoutPromise]) as User;
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Tentative ${retries}/${maxRetries} pour récupérer le profil...`);
          // Attendre un peu avant de réessayer (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          return fetchWithRetry();
        } else {
          console.error('Erreur lors de la récupération du profil après plusieurs tentatives:', error);
          // Retourner un profil par défaut en cas d'échec
          return {
            uid,
            email: firebaseUser?.email || '',
            displayName: firebaseUser?.displayName || '',
            photoURL: firebaseUser?.photoURL || '',
            role: 'admin', // Toujours admin par défaut
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }
    };
    
    return fetchWithRetry();
  };

  // Observer les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          
          // Récupérer le profil utilisateur avec timeout et retry
          const userProfile = await getUserProfile(fbUser.uid);
          if (userProfile) {
            setUser(userProfile);
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors du processus d\'authentification:', error);
        setError('Erreur lors de l\'authentification. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Connexion
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(result.user);
      
      // Récupérer le profil utilisateur (non bloquant)
      getUserProfile(result.user.uid)
        .then(userProfile => {
          if (userProfile) {
            setUser(userProfile);
          }
        })
        .catch(error => {
          console.error('Erreur lors de la récupération du profil:', error);
          // Ne pas bloquer le processus de connexion si la récupération du profil échoue
        });
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Email ou mot de passe incorrect.' 
        : 'Erreur lors de la connexion. Veuillez réessayer.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      router.push('/admin/login');
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      setError(error.message);
    }
  };

  // Réinitialisation du mot de passe
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    try {
      setError(null);
      if (!user || !firebaseUser) throw new Error('Aucun utilisateur connecté');

      const updateData: { displayName?: string; photoURL?: string } = {};
      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.photoURL = photoURL;

      await updateProfile(firebaseUser, updateData);

      // Mettre à jour le profil dans Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...updateData,
        updatedAt: new Date()
      });
      
      // Mettre à jour l'état local
      setUser({
        ...user,
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Changement de mot de passe
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      if (!user || !user.email || !firebaseUser) throw new Error('Aucun utilisateur connecté');

      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // Mettre à jour le mot de passe
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Envoyer un email de vérification
  const verifyEmail = async () => {
    try {
      setError(null);
      if (!user || !firebaseUser) throw new Error('Aucun utilisateur connecté');
      await sendEmailVerification(firebaseUser);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Configurer l'authentification à deux facteurs
  const setupMFA = async (phoneNumber: string) => {
    try {
      setError(null);
      if (!user || !firebaseUser) throw new Error('Aucun utilisateur connecté');

      // Créer un RecaptchaVerifier
      if (typeof window !== 'undefined') {
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });

        // Get multiFactor instance
        const multiFactorUser = multiFactor(firebaseUser);
        
        // Add phone number
        const phoneInfoOptions = {
          phoneNumber,
          session: await multiFactorUser.getSession(),
        };
        
        // Send SMS verification code
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          phoneInfoOptions,
          recaptchaVerifier
        );
        
        // TODO: Prompt user for verification code and enroll
        // This would be done in a separate function after receiving the code
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    changePassword,
    verifyEmail,
    setupMFA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}; 