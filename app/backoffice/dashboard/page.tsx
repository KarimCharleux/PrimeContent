'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface Activity {
  id: string;
  type: 'photo' | 'video' | 'event' | 'message' | 'client';
  title: string;
  date: string;
  status?: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

// Composant statistique
const StatCard = ({ title, value, icon, color, change, trend }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow-sm p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {change && (
          <div className="flex items-center mt-2">
            {trend === 'up' && (
              <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-3 h-3 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    visitors: { value: 0, change: '0%', trend: 'neutral' as 'up' | 'down' | 'neutral' },
    photos: { value: 0, change: '0%', trend: 'neutral' as 'up' | 'down' | 'neutral' },
    videos: { value: 0, change: '0%', trend: 'neutral' as 'up' | 'down' | 'neutral' },
    events: { value: 0, change: '0%', trend: 'neutral' as 'up' | 'down' | 'neutral' },
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  // Simuler le chargement des données (à remplacer par de vraies requêtes API)
  useEffect(() => {
    // Simule une requête API
    const loadData = setTimeout(() => {
      setStats({
        visitors: { value: 1243, change: '+12.5%', trend: 'up' },
        photos: { value: 89, change: '+5.2%', trend: 'up' },
        videos: { value: 21, change: '-2.1%', trend: 'down' },
        events: { value: 8, change: '+33.3%', trend: 'up' },
      });

      setRecentActivities([
        { id: '1', type: 'message', title: 'Nouveau message de Julie Dupont', date: '10 juin 2023' },
        { id: '2', type: 'photo', title: 'Nouvelle photo ajoutée à la galerie Mariage', date: '9 juin 2023' },
        { id: '3', type: 'event', title: 'Événement "Gala annuel" créé', date: '8 juin 2023' },
        { id: '4', type: 'client', title: 'Nouveau client: Thomas Martin', date: '7 juin 2023' },
        { id: '5', type: 'video', title: 'Nouvelle vidéo téléchargée: "Mariage Martin"', date: '6 juin 2023' },
      ]);

      setUpcomingTasks([
        { id: '1', title: 'Séance photo pour Thomas', dueDate: '18 juin 2023', priority: 'high', completed: false },
        { id: '2', title: 'Édition vidéo - Mariage Durand', dueDate: '22 juin 2023', priority: 'medium', completed: false },
        { id: '3', title: 'Appel client - Préparation événement', dueDate: '15 juin 2023', priority: 'high', completed: false },
      ]);

      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(loadData);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Obtenir la date actuelle
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('fr-FR', options);
  const hours = currentDate.getHours();
  
  // Déterminer le message de salutation
  let greeting = '';
  if (hours < 12) {
    greeting = 'Bonjour';
  } else if (hours < 18) {
    greeting = 'Bon après-midi';
  } else {
    greeting = 'Bonsoir';
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-500">{formattedDate}</p>
        <h2 className="text-xl mt-4 text-gray-700">
          {greeting}, <span className="font-medium">{user?.displayName || 'Admin'}</span>
        </h2>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Visiteurs (30j)"
          value={stats.visitors.value}
          change={stats.visitors.change}
          trend={stats.visitors.trend}
          icon={
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="bg-blue-100"
        />
        <StatCard
          title="Photos"
          value={stats.photos.value}
          change={stats.photos.change}
          trend={stats.photos.trend}
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="bg-purple-100"
        />
        <StatCard
          title="Vidéos"
          value={stats.videos.value}
          change={stats.videos.change}
          trend={stats.videos.trend}
          icon={
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          color="bg-red-100"
        />
        <StatCard
          title="Événements"
          value={stats.events.value}
          change={stats.events.change}
          trend={stats.events.trend}
          icon={
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="bg-green-100"
        />
      </div>

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités récentes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Activités récentes</h3>
              <Link href="#" className="text-blue-600 text-sm hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="rounded-full p-2 mr-4 flex-shrink-0">
                    {activity.type === 'photo' && (
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === 'video' && (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === 'event' && (
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === 'message' && (
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === 'client' && (
                      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accès rapides */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-6">Accès rapides</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/backoffice/photos" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="rounded-full bg-purple-100 p-3 mb-2">
                  <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Photos</span>
              </Link>
              <Link href="/backoffice/videos" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="rounded-full bg-red-100 p-3 mb-2">
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Vidéos</span>
              </Link>
              <Link href="/backoffice/events" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="rounded-full bg-green-100 p-3 mb-2">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Événements</span>
              </Link>
              <Link href="/backoffice/clients" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="rounded-full bg-yellow-100 p-3 mb-2">
                  <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Clients</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar - Tâches à venir */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium mb-6">Tâches à venir</h3>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start p-3 border border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => {
                      // À implémenter: toggleCompleted(task.id)
                    }}
                    className="rounded mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Faible'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Échéance: {task.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter une tâche
            </button>
          </div>

          {/* Statistiques du site */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Performances du site</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Vitesse de chargement</span>
                  <span className="text-sm font-medium text-gray-800">1.2s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Mobile</span>
                  <span className="text-sm font-medium text-gray-800">92/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">SEO</span>
                  <span className="text-sm font-medium text-gray-800">96/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <Link href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center mt-2">
                Voir le rapport complet
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 