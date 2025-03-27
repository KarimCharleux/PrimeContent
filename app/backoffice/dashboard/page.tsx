'use client';

import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase-client';


// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  linkTo?: string;
}

const StatCard = ({ title, value, icon, change, trend, linkTo }: StatCardProps) => {
  const Card = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center">
      <div className="mr-4 bg-blue-50 p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <span className={`ml-2 text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return linkTo ? (
    <Link href={linkTo} className="block">
      <Card />
    </Link>
  ) : (
    <Card />
  );
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    photos: 0,
    videos: 0,
    events: 0,
    weddings: 0,
    clients: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer les statistiques et les éléments récents de Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le nombre d'éléments dans chaque collection
        const collections = ['gallery', 'videos', 'events', 'weddings', 'clients'];
        const counts: Record<string, number> = {};

        for (const collectionName of collections) {
          const querySnapshot = await getDocs(collection(db, collectionName));
          counts[collectionName] = querySnapshot.size;
        }

        // Mettre à jour les statistiques
        setStats({
          photos: counts.gallery || 0,
          videos: counts.videos || 0,
          events: counts.events || 0,
          weddings: counts.weddings || 0,
          clients: counts.clients || 0,
        });

        // Récupérer les éléments récents
        const recentProjects = await getDocs(
          query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(5))
        );

        const recentItemsData = recentProjects.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'project',
        }));

        setRecentItems(recentItemsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user) {
      fetchData();
    }
  }, [loading, user]);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">
          Bienvenue, {user?.displayName || user?.email || 'Utilisateur'} !
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Photos" 
          value={stats.photos} 
          linkTo="/backoffice/photos"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Vidéos" 
          value={stats.videos} 
          linkTo="/backoffice/videos"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Événements" 
          value={stats.events} 
          linkTo="/backoffice/events"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          }
        />
        <StatCard 
          title="Clients" 
          value={stats.clients} 
          linkTo="/backoffice/clients"
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          }
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h2>
        
        {recentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.createdAt?.toDate?.()
                          ? new Date(item.createdAt.toDate()).toLocaleDateString('fr-FR')
                          : 'Date inconnue'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/backoffice/${item.type}s/${item.id}`} className="text-blue-600 hover:text-blue-900">
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/backoffice/photos/new" className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="h-6 w-6 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Ajouter des photos</span>
          </Link>
          <Link href="/backoffice/videos/new" className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="h-6 w-6 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Ajouter des vidéos</span>
          </Link>
          <Link href="/backoffice/events/new" className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="h-6 w-6 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Créer un événement</span>
          </Link>
          <Link href="/backoffice/clients/new" className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="h-6 w-6 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Ajouter un client</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 