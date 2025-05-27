import {Component, Input} from '@angular/core';
import {Card} from "../card";
import {RouterLink} from "@angular/router";
import {NgOptimizedImage} from "@angular/common";
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-card',
    imports: [
        RouterLink,
        NgOptimizedImage, MatButtonModule, MatCardModule, CommonModule
    ],
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss']
})
export class CardComponent {
    private _cardContent!: Card;

    @Input()
    set cardContent(value: Card) {
        this._cardContent = value;
        this.cardContent.displayName = this.displayName(this.cardContent.type);
    }

    get cardContent(): Card {
        return this._cardContent;
    }

    private displayName(type: string): string {
        return type === 'COUNTRY' ? 'PAYS' : type;
    }
}
