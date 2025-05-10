import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CardsService} from '../cards.service';
import {Card} from "../card";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-details',
    imports: [
        NgOptimizedImage
    ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],
})
export class DetailsComponent implements OnInit {
  route: ActivatedRoute = inject(ActivatedRoute);
  cardService = inject(CardsService);
  card: Card;
  cardId: number;

  constructor() {
    this.cardId = Number(this.route.snapshot.params['id']);
    this.card = {id: this.cardId, name: '', type: '', photo: ''};
  }

  ngOnInit(): void {
    this.cardService.getCountryById(this.cardId).then(
        card => {
          console.log(card);
          this.card = card;
          this.card.photo = this.cardService.mapsUrl + '/' + card.name.toLowerCase() + '.svg'
        });
    }
}
