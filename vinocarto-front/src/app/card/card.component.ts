import { Component, Input } from '@angular/core';
import { Card } from "../card";
import {RouterLink} from "@angular/router";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-card',
  imports: [
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() cardContent!: Card;
}
