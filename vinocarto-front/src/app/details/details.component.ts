import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CardsService} from '../cards.service';
import {Card} from "../card";
import {PointAndClickComponent} from "../point-and-click/point-and-click.component";
import {MatIcon} from "@angular/material/icon";
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {FindAllComponent} from "../find-all/find-all.component";
import {PreferencesService} from "../utils/preferences.service";

@Component({
    selector: 'app-details',
    imports: [
        PointAndClickComponent,
        MatIcon,
        MatSelectModule,
        FormsModule,
        CommonModule,
        FindAllComponent
    ],
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
    route: ActivatedRoute = inject(ActivatedRoute);
    cardService = inject(CardsService);
    card: Card;
    cardId: number;
    selectedValue: string = '';
    options = [
        {label: 'point and click', value: 'pointAndClick'},
        {label: 'find all', value: 'findAll'},
        {label: 'recherche forcée', value: 'forcedSearch'},
        {label: 'leçon', value: 'lesson'}
    ];

    constructor(private preferenceService: PreferencesService,) {
        this.cardId = Number(this.route.snapshot.params['id']);
        this.card = {id: this.cardId, name: '', type: '', photo: ''};
    }

    ngOnInit(): void {
        this.cardService.getCountryById(this.cardId).then(
            card => {
                this.card = card;
                this.card.photo = this.cardService.mapsUrl + '/' + card.name.toLowerCase() + '.svg'
                this.selectedValue = this.preferenceService.getGameMode() ?? this.options[0].value;
            });
    }

    onGameModeChange(option: string) {
        this.preferenceService.setGameMode(option);
    }
}
