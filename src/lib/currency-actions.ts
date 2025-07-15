
'use server';

const FRANKFURTER_API_URL = 'https://api.frankfurter.app/latest';

/**
 * Gets the latest EUR to COP conversion rate.
 * Uses Next.js's built-in fetch caching to avoid excessive API calls.
 * @returns The numeric conversion rate for EUR to COP.
 */
export async function getEurToCopRate(): Promise<number> {
    try {
        const response = await fetch(`${FRANKFURTER_API_URL}?from=EUR&to=COP`, {
            next: { revalidate: 3600 }, // Revalidate every hour
             headers: {
                'User-Agent': 'colombia-en-esp-app/1.0',
            }
        });

        if (!response.ok) {
            // Log more detailed error information on the server
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
        // Fallback to a safe, static rate if the API fails for any reason
        return 4300; 
    }
}
