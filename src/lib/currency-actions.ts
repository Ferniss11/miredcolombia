
'use server';

// A simple, no-key-required API for currency conversion.
const FRANKFURTER_API_URL = 'https://api.frankfurter.app';

// Cache for the conversion rate to avoid hitting the API on every request.
let cachedRate: { value: number, timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Gets the latest EUR to COP conversion rate.
 * It uses a simple in-memory cache to avoid excessive API calls.
 * @returns The numeric conversion rate for EUR to COP.
 */
export async function getEurToCopRate(): Promise<number> {
    const now = Date.now();

    // Return cached rate if it's recent
    if (cachedRate && (now - cachedRate.timestamp < CACHE_DURATION_MS)) {
        return cachedRate.value;
    }

    try {
        // Using Next.js's built-in fetch caching and revalidation
        const response = await fetch(`${FRANKFURTER_API_URL}/latest?from=EUR&to=COP`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch conversion rate: ${response.statusText}`);
        }

        const data = await response.json();
        const rate = data.rates.COP;

        if (typeof rate !== 'number') {
            throw new Error('Invalid rate format received from API');
        }

        // Update cache
        cachedRate = { value: rate, timestamp: now };

        return rate;

    } catch (error) {
        console.error("Error fetching or parsing currency conversion rate:", error);
        // Fallback to a safe, static rate if the API fails
        return 4300; 
    }
}

