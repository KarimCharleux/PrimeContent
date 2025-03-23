'use client';

import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'editor' | 'viewer';

// Définir les permissions pour chaque rôle
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
  editor: [
    'view_dashboard',
    'create_content',
    'edit_content',
    'publish_content',
    'view_analytics',
  ],
  viewer: [
    'view_dashboard',
    'view_content',
  ],
};

export const useRoleAccess = () => {
  const { userProfile } = useAuth();
  
  // Obtenir les permissions basées sur le rôle de l'utilisateur
  const getUserPermissions = (): string[] => {
    if (!userProfile) return [];
    
    const role = userProfile.role as UserRole;
    return rolePermissions[role] || [];
  };
  
  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    
    const permissions = getUserPermissions();
    return permissions.includes(permission);
  };
  
  // Vérifier si l'utilisateur a un rôle spécifique ou supérieur
  const hasRole = (minimumRole: UserRole): boolean => {
    if (!userProfile) return false;
    
    const roleHierarchy = {
      admin: 3,
      editor: 2,
      viewer: 1,
    };
    
    const userRoleLevel = roleHierarchy[userProfile.role as UserRole] || 0;
    const requiredRoleLevel = roleHierarchy[minimumRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };
  
  return {
    userRole: userProfile?.role as UserRole | undefined,
    getUserPermissions,
    hasPermission,
    hasRole,
  };
}; 