import {Injectable} from '@angular/core';
import {Card} from "../card";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  constructor() { }

  readonly mapsUrl = '/assets/maps';

  async getAllDetails(): Promise<Card[]> {
    const data = await fetch(`${environment.apiBaseUrl}/detail/all`);
    return (await data.json()) ?? [];
  }

  async getDetailById(id: number): Promise<Card> {
    const data = await fetch(`${environment.apiBaseUrl}/detail/id/` + id);
    return data.json();
  }

  getCardNameFromType(card: Card): string {
    return card.type === 'COUNTRY' ? card.country :
           card.type === 'REGION' ? card.region :
            card.appellation;
  }

}
