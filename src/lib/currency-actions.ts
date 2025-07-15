
'use server';

const FRANKFURTER_API_URL = 'https://api.frankfurter.app/latest';

// Simple in-memory cache to avoid hitting the API on every request
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Gets the latest EUR to COP conversion rate.
 * Uses a simple in-memory cache to avoid excessive API calls.
 * @returns The numeric conversion rate for EUR to COP.
 */
export async function getEurToCopRate(): Promise<number> {
    const now = Date.now();
    if (cachedRate && now - cachedRate.timestamp < CACHE_DURATION_MS) {
        return cachedRate.rate;
    }

    try {
        // Use { cache: 'no-store' } to bypass Next.js fetch caching for this specific call
        const response = await fetch(`${FRANKFURTER_API_URL}?from=EUR&to=COP`, {
            cache: 'no-store', 
            headers: {
                'User-Agent': 'colombia-en-esp-app/1.0',
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Frankfurter API Error: ${response.status} ${response.statusText}`, { url: response.url, body: errorBody });
            throw new Error(`Failed to fetch conversion rate: ${response.statusText}`);
        }

        const data = await response.json();
        const rate = data.rates.COP;

        if (typeof rate !== 'number') {
            throw new Error('Invalid rate format received from API');
        }
        
        // Update the cache
        cachedRate = { rate, timestamp: now };

        return rate;

    } catch (error) {
        console.error("Error fetching or parsing currency conversion rate:", error);
        // Fallback to a safe, static rate if the API fails
        return cachedRate?.rate || 4300; 
    }
}
