// src/lib/directory/infrastructure/search/google-places.adapter.ts
import { Client } from '@googlemaps/google-maps-services-js';
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
    const fields: (keyof Business)[] = [
      'displayName', 'formattedAddress', 'internationalPhoneNumber', 'website', 'url',
      'rating', 'userRatingsTotal', 'photos', 'openingHours', 'geometry',
      'reviews', 'priceLevel', 'servesBeer', 'servesWine', 'wheelchairAccessibleEntrance',
      'editorialSummary'
    ];

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: fields as any, // Cast because the library's types are slightly different
          key: apiKey,
          language: 'es',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API returned status: ${response.data.status}`);
      }

      const details = response.data.result;

      const photos: Photo[] = (details.photos || []).slice(0, 10).map((p: any) => ({
          photo_reference: p.photo_reference,
          height: p.height,
          width: p.width,
          html_attributions: p.html_attributions,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${p.photo_reference}&key=${apiKey}`
      }));

      const businessData: Partial<Business> = {
        displayName: details.name,
        formattedAddress: details.formatted_address,
        internationalPhoneNumber: details.international_phone_number,
        website: details.website,
        url: details.url,
        rating: details.rating,
        userRatingsTotal: details.user_ratings_total,
        openingHours: details.opening_hours?.weekday_text,
        isOpenNow: details.opening_hours?.open_now,
        photos,
        reviews: details.reviews as Review[],
        geometry: details.geometry,
        priceLevel: details.price_level,
        servesBeer: details.serves_beer,
        servesWine: details.serves_wine,
        wheelchairAccessibleEntrance: details.wheelchair_accessible_entrance,
        editorialSummary: details.editorial_summary?.overview
      };

      return businessData;

    } catch (error) {
      console.error(`Error fetching details for placeId ${placeId} from Google:`, error);
      return null;
    }
  }
}