import {Injectable} from '@angular/core';
import {Card} from "../card";

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  constructor() { }

  readonly mapsUrl = '/assets/maps';
  url = 'http://localhost:8080';

  async getAllDetails(): Promise<Card[]> {
    const data = await fetch(this.url + '/detail/all');
    return (await data.json()) ?? [];
  }

  async getDetailById(id: number): Promise<Card> {
    const data = await fetch(this.url + '/detail/id/' + id);
    return data.json();
  }

  getCardNameFromType(card: Card): string {
    return card.type === 'COUNTRY' ? card.country :
           card.type === 'REGION' ? card.region :
            card.appellation;
  }

}
