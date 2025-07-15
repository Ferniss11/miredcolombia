
'use server';

const FRANKFURTER_API_URL = 'https://api.frankfurter.app/latest';

/**
 * Gets the latest EUR to COP conversion rate.
 * Uses Next.js fetch caching to avoid excessive API calls.
 * @returns The numeric conversion rate for EUR to COP.
 */
export async function getEurToCopRate(): Promise<number> {
    try {
        // Use Next.js fetch caching, revalidating every hour.
        const response = await fetch(`${FRANKFURTER_API_URL}?from=EUR&to=COP`, {
            next: { revalidate: 3600 }, 
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
        
        return rate;

    } catch (error) {
        console.error("Error fetching or parsing currency conversion rate:", error);
        // Fallback to a safe, static rate if the API fails
        return 4300; 
    }
}
