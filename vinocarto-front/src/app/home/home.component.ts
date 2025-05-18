import {Component, inject, OnInit} from '@angular/core';
import {CardComponent} from "../card/card.component";
import {Card} from "../card";
import {NgForOf} from "@angular/common";
import {CardsService} from "../cards.service";

@Component({
  selector: 'app-home',
  imports: [CardComponent, NgForOf],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  cardList: Card[] = [];
  filteredCardList: Card[] = [];
  cardService: CardsService = inject(CardsService);

  ngOnInit() {
    this.cardService.getAllDetails().then(
        cards => {
            console.log(cards);
          for (const card of cards) {
            card.name = this.cardService.getCardNameFromType(card);
            card.photo = this.cardService.mapsUrl + '/' + card.name.toLowerCase() + '.svg';
          }
          this.cardList = cards;
          this.filteredCardList = cards;
        },
        error => console.error('Erreur de chargement des cartes:', error)
    );
  }


  filterResults(text: string) {
    if (!text) {
      this.filteredCardList = this.cardList;
      return;
    }
    this.filteredCardList = this.cardList.filter((card) =>
        card?.name.toLowerCase().includes(text.toLowerCase()),
    );
  }
}
