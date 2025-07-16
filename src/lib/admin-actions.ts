
'use server';

import { getTotalUserCount } from "@/services/admin.service";
import { getPublishedBlogPosts } from "@/services/blog.service";
import { getSavedBusinessesAction } from "@/lib/directory-actions";

export type AdminDashboardStats = {
    userCount: number;
    businessCount: number;
    blogPostCount: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
        const [
            userCountResult,
            businessesResult,
            blogPostsResult
        ] = await Promise.all([
            getTotalUserCount(),
            getSavedBusinessesAction(true), // true for only published/approved
            getPublishedBlogPosts(),
        ]);

        return {
            userCount: userCountResult,
            businessCount: businessesResult.businesses?.length || 0,
            blogPostCount: blogPostsResult.posts?.length || 0,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return zeroed stats on error to prevent the page from crashing
        return {
            userCount: 0,
            businessCount: 0,
            blogPostCount: 0,
        };
    }
}
