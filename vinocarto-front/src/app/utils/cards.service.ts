import { Injectable } from '@angular/core';
import { Card } from "../card";

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  constructor() { }

  // Use relative path so base-href on GitHub Pages works correctly
  readonly mapsUrl = 'assets/maps';
  private dataUrl = 'assets/data/data.json';

  /**
   * Récupère tous les détails et reconstruit l'objet Card attendu par le Front
   */
  async getAllDetails(): Promise<Card[]> {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) {
        throw new Error(`Impossible de charger les données: ${response.status}`);
      }

      const data = await response.json();

      const countries = data.country || [];
      const regions = data.region || [];
      const appellations = data.appellation || [];
      const detailsRaw = data.detail || [];

      // Map pour traduire le type numérique de la BDD en chaîne textuelle pour le Front
      const typesMap: { [key: string]: string } = { '0': 'COUNTRY', '1': 'REGION', '2': 'APPELLATION' };

      return detailsRaw.map((d: any) => {
        const currentCountry = countries.find((c: any) => c.id === d.country_id_fk);
        const currentRegion = regions.find((r: any) => r.id === d.region_id_fk);
        const currentAppellation = appellations.find((a: any) => a.id === d.appellation_id_fk);

        const card: Card = {
          id: d.id,
          country: currentCountry ? currentCountry.name : '',
          region: currentRegion ? currentRegion.name : '',
          appellation: currentAppellation ? currentAppellation.name : '',
          type: typesMap[d.type] || '',
          description: d.description || '',
          name: '', // Rempli juste après
          photo: null,
          countryPicture: currentCountry ? `assets/maps/${currentCountry.iso_code.toLowerCase()}.svg` : '',
          displayName: '' // Optionnel dans ton interface, initialisé vide ici
        };

        // On remplit le champ name via ta méthode existante
        card.name = this.getCardNameFromType(card);

        return card;
      });

    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      return [];
    }
  }

  /**
   * Récupère un détail spécifique par son ID
   */
  async getDetailById(id: number): Promise<Card> {
    const allDetails = await this.getAllDetails();
    const card = allDetails.find(d => d.id === id);

    if (!card) {
      return {
        id,
        region: "",
        country: "",
        type: "",
        appellation: "",
        description: "Donnée non disponible",
        name: "",
        photo: null,
        countryPicture: ""
      };
    }

    return card;
  }

  /**
   * Ta méthode d'origine basée sur les chaînes 'COUNTRY' et 'REGION'
   */
  getCardNameFromType(card: Card): string {
    return card.type === 'COUNTRY' ? card.country :
        card.type === 'REGION' ? card.region :
            card.appellation;
  }
}