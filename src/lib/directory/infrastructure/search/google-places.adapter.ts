// src/lib/directory/infrastructure/search/google-places.adapter.ts
import { Client, PlaceData } from '@googlemaps/google-maps-services-js';
import type { Business } from '../../domain/business.entity';
import type { SearchAdapter } from './search.adapter';
import type { Photo, Review } from '@/lib/types';

export class GooglePlacesAdapter implements SearchAdapter {
  private client: Client;

  constructor() {
    this.client = new Client({});
  }

  private getApiKey(): string {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured.");
    }
    return apiKey;
  }

  async getRichDetails(placeId: string): Promise<Partial<Business> | null> {
    const apiKey = this.getApiKey();
    // These are the fields we request from Google Places API
    const fields: (keyof PlaceData)[] = [
      'name', 'formatted_address', 'international_phone_number', 'website', 'url',
      'rating', 'user_ratings_total', 'photos', 'opening_hours', 'geometry',
      'reviews', 'price_level', 'serves_beer', 'serves_wine', 'wheelchair_accessible_entrance',
      'editorial_summary', 'address_components'
    ];

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: fields as any,
          key: apiKey,
          language: 'es',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API returned status: ${response.data.status} for placeId ${placeId}. Message: ${response.data.error_message}`);
      }

      const details = response.data.result;

      const photos: Photo[] = (details.photos || []).slice(0, 10).map((p: any) => ({
          photo_reference: p.photo_reference,
          height: p.height,
          width: p.width,
          html_attributions: p.html_attributions,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${p.photo_reference}&key=${apiKey}`
      }));
      
      const cityComponent = details.address_components?.find((c: any) => c.types.includes('locality'));
      const city = cityComponent ? cityComponent.long_name : 'Ciudad no disponible';

      // Map API response to our Business entity
      const businessData: Partial<Business> = {
        id: placeId,
        displayName: details.name,
        formattedAddress: details.formatted_address,
        internationalPhoneNumber: details.international_phone_number || '',
        website: details.website || '',
        url: details.url,
        rating: details.rating,
        userRatingsTotal: details.user_ratings_total,
        openingHours: details.opening_hours?.weekday_text,
        isOpenNow: details.opening_hours?.open_now,
        photos,
        reviews: details.reviews as Review[],
        geometry: details.geometry,
        priceLevel: details.price_level === undefined ? null : details.price_level, // Convert undefined to null
        servesBeer: details.serves_beer,
        servesWine: details.serves_wine,
        wheelchairAccessibleEntrance: details.wheelchair_accessible_entrance,
        editorialSummary: details.editorial_summary?.overview || '',
        city: city,
      };

      return businessData;

    } catch (error) {
      console.error(`Error fetching details for placeId ${placeId} from Google:`, error);
      return null;
    }
  }
}
