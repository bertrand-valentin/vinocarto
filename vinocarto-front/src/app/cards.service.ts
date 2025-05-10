import {Injectable} from '@angular/core';
import {Card} from "./card";

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  constructor() { }

  readonly mapsUrl = '/assets/maps';
  url = 'http://localhost:8080';

  async getAllCountries(): Promise<Card[]> {
    const data = await fetch(this.url + '/country/all');
    return (await data.json()) ?? [];
  }
  async getCountryById(id: number): Promise<Card> {
    const data = await fetch(this.url + '/country/id/' + id);
    return data.json();
  }

}
