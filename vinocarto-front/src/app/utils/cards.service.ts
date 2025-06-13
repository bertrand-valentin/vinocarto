import { Injectable } from '@angular/core';
import { Card } from "../card";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  constructor() { }

  readonly mapsUrl = '/assets/maps';
  private fallbackUrl = '/assets/fallback/fallback-details.json';

  async getAllDetails(): Promise<Card[]> {
    const response = await fetch(`${environment.apiBaseUrl}/detail/all`);
    if (!response.ok) {
      if (response.status === 403) {
        console.warn('API bloquée (403), chargement du fallback local');
        const fallbackResponse = await fetch(this.fallbackUrl);
        return await fallbackResponse.json();
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  }

  async getDetailById(id: number): Promise<Card> {
    const response = await fetch(`${environment.apiBaseUrl}/detail/id/${id}`);
    if (!response.ok) {
      if (response.status === 403) {
        console.warn('API bloquée (403), chargement du fallback local');
        const fallbackData = await (await fetch(this.fallbackUrl)).json();
        return fallbackData.find((card: Card) => card.id === id)
            || { id, region: "", country: "", type: "", appellation: "", mapReady: false, description: "Donnée non disponible", name :"", photo : "", countryPicture :"" };
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json();
  }

  getCardNameFromType(card: Card): string {
    return card.type === 'COUNTRY' ? card.country :
           card.type === 'REGION' ? card.region :
            card.appellation;
  }
}