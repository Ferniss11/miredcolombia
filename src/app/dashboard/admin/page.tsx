
import { getAdminDashboardStats } from '@/lib/admin-actions';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
    const stats = await getAdminDashboardStats();

    return <AdminDashboardClient stats={stats} />;
}
