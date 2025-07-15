
'use server';

// NOTE: This service now uses ExchangeRate-API.
// You need to get a free API key from https://www.exchangerate-api.com/
// and add it to your .env file as EXCHANGERATE_API_KEY
const API_KEY = process.env.EXCHANGERATE_API_KEY;
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EUR`;

/**
 * Gets the latest EUR to COP conversion rate from ExchangeRate-API.
 * Uses Next.js fetch caching to avoid excessive API calls.
 * @returns The numeric conversion rate for EUR to COP.
 */
export async function getEurToCopRate(): Promise<number> {
    if (!API_KEY) {
        console.warn("EXCHANGERATE_API_KEY is not set. Using fallback rate.");
        return 4300;
    }

    try {
        // Use Next.js fetch caching, revalidating every hour.
        const response = await fetch(API_URL, {
            next: { revalidate: 3600 }, 
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`ExchangeRate-API Error: ${response.status} ${response.statusText}`, { url: response.url, body: errorBody });
            throw new Error(`Failed to fetch conversion rate: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.result === 'error') {
            throw new Error(`API returned an error: ${data['error-type']}`);
        }
        
        const rate = data.conversion_rates.COP;

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
