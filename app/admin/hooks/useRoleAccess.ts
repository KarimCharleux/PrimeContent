'use client';

import { useAuth } from './useAuth';

export type UserRole = 'admin';

// Définir les permissions pour l'administrateur
const rolePermissions = {
  admin: [
    'view_dashboard',
    'manage_users',
    'create_content',
    'edit_content',
    'delete_content',
    'publish_content',
    'manage_settings',
    'view_analytics',
  ],
};

export const useRoleAccess = () => {
  const { user } = useAuth();
  
  // Obtenir les permissions de l'administrateur
  const getUserPermissions = (): string[] => {
    if (!user) return [];
    return rolePermissions.admin;
  };
  
  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rolePermissions.admin.includes(permission);
  };
  
  // Vérifier si l'utilisateur est admin (toujours vrai si connecté)
  const hasRole = (role: UserRole): boolean => {
    return !!user;
  };
  
  return {
    userRole: user ? 'admin' : undefined,
    getUserPermissions,
    hasPermission,
    hasRole,
  };
}; 