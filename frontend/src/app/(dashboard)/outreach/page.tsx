'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';
import { api } from '@/lib/api';
import { OutreachDashboardStats } from '@/types';
import {
  Rocket,
  Mail,
  Users,
  Zap,
  Send,
  Eye,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function OutreachDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OutreachDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<OutreachDashboardStats>('/outreach/dashboard')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <>
      <Header title="Email Outreach" user={user} />
      <div className="p-3 sm:p-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Link href="/outreach/accounts" className="btn-primary w-full sm:w-auto justify-center flex items-center gap-2">
            <Mail size={16} /> Почтовые аккаунты
          </Link>
          <Link href="/outreach/leads" className="btn-secondary w-full sm:w-auto justify-center flex items-center gap-2">
            <Users size={16} /> База лидов
          </Link>
          <Link href="/outreach/campaigns" className="btn-secondary w-full sm:w-auto justify-center flex items-center gap-2">
            <Zap size={16} /> Кампании
          </Link>
          <Link href="/outreach/inbox" className="btn-secondary w-full sm:w-auto justify-center flex items-center gap-2">
            <MessageSquare size={16} /> Входящие
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Почтовых аккаунтов"
                value={stats.totalAccounts}
                icon={<Mail size={22} className="text-blue-600" />}
                color="bg-blue-50 dark:bg-blue-900/30"
              />
              <StatCard
                label="Лидов в базе"
                value={stats.totalLeads}
                icon={<Users size={22} className="text-violet-600" />}
                color="bg-violet-50 dark:bg-violet-900/30"
              />
              <StatCard
                label="Всего кампаний"
                value={stats.totalCampaigns}
                icon={<Zap size={22} className="text-amber-600" />}
                color="bg-amber-50 dark:bg-amber-900/30"
              />
              <StatCard
                label="Активных кампаний"
                value={stats.activeCampaigns}
                icon={<Rocket size={22} className="text-green-600" />}
                color="bg-green-50 dark:bg-green-900/30"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Статистика рассылок
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Отправлено"
                value={stats.totalSent}
                icon={<Send size={22} className="text-blue-600" />}
                color="bg-blue-50 dark:bg-blue-900/30"
              />
              <StatCard
                label="Открыто"
                value={stats.totalOpened}
                icon={<Eye size={22} className="text-teal-600" />}
                color="bg-teal-50 dark:bg-teal-900/30"
              />
              <StatCard
                label="Ответов"
                value={stats.totalReplied}
                icon={<MessageSquare size={22} className="text-green-600" />}
                color="bg-green-50 dark:bg-green-900/30"
              />
              <StatCard
                label="Отскочило"
                value={stats.totalBounced}
                icon={<AlertTriangle size={22} className="text-red-600" />}
                color="bg-red-50 dark:bg-red-900/30"
              />
            </div>

            {stats.totalSent > 0 && (
              <div className="mt-6 card">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Конверсии
                </h4>
                <div className="flex flex-wrap gap-4 sm:gap-8">
                  <div className="min-w-[120px]">
                    <span className="text-2xl font-bold text-teal-600">
                      {((stats.totalOpened / stats.totalSent) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">Open Rate</p>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-2xl font-bold text-green-600">
                      {((stats.totalReplied / stats.totalSent) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">Reply Rate</p>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-2xl font-bold text-red-600">
                      {((stats.totalBounced / stats.totalSent) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">Bounce Rate</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <Rocket size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Начните с подключения почтовых аккаунтов и загрузки базы лидов
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Как это работает?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: 'Подключите почты',
                desc: 'Подключите корпоративные почтовые аккаунты для рассылок. Чем больше почт — тем больше писем.',
              },
              {
                step: 2,
                title: 'Загрузите базу',
                desc: 'Добавьте вашу базу B2B компаний. Импортируйте CSV или добавляйте лидов вручную.',
              },
              {
                step: 3,
                title: 'Создайте цепочку',
                desc: 'Составьте цепочку писем с задержками. Используйте переменные для персонализации.',
              },
              {
                step: 4,
                title: 'Запустите рассылку',
                desc: 'Мы отправим письма, имитируя ручную отправку. Отслеживайте ответы в реальном времени.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
