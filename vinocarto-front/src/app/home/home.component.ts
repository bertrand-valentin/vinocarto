import {Component, inject, OnInit} from '@angular/core';
import {CardComponent} from "../card/card.component";
import {Card} from "../card";
import {NgForOf} from "@angular/common";
import {CardsService} from "../utils/cards.service";
import {StringUtilsService} from "../utils/string-utils.service";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-home',
  imports: [CardComponent, NgForOf, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  cardList: Card[] = [];
  filteredCardList: Card[] = [];
  cardService: CardsService = inject(CardsService);
  stringService: StringUtilsService = inject(StringUtilsService);
  searchText = '';
  sortField: keyof Card = 'name';
  sortAsc = true;



  toggleSortDirection() {
    this.sortAsc = !this.sortAsc;
    this.applyFilter();
  }

  ngOnInit() {
    this.cardService.getAllDetails().then(
        cards => {
          for (const card of cards) {
            card.name = this.cardService.getCardNameFromType(card);
            card.photo = this.cardService.mapsUrl + '/' + this.stringService.sanitize(card.name) + '.svg';
            card.countryPicture = this.cardService.mapsUrl + '/' + card.country.toLowerCase() + '.svg';
          }
          this.cardList = cards;
          this.filteredCardList = cards;
        },
        error => console.error('Erreur de chargement des cartes:', error)
    );
  }

  applyFilter() {
    const text = this.stringService.sanitize(this.searchText);
    this.filteredCardList = this.cardList
        .filter(card => this.stringService.sanitize(card.name).includes(text))
        .sort((a, b) => {
          const valA = (a[this.sortField] || '').toString().toLowerCase();
          const valB = (b[this.sortField] || '').toString().toLowerCase();
          return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
  }
}
