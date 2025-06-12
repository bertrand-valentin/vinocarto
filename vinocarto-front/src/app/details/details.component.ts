import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CardsService} from '../utils/cards.service';
import {Card} from "../card";
import {PointAndClickComponent} from "../game-mode/point-and-click/point-and-click.component";
import {MatIcon} from "@angular/material/icon";
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {FindAllComponent} from "../game-mode/find-all/find-all.component";
import {PreferencesService} from "../utils/preferences.service";
import {StringUtilsService} from "../utils/string-utils.service";
import {ForcedSearchComponent} from "../game-mode/forced-search/forced-search.component";
import {AutoSearchComponent} from "../game-mode/auto-search/auto-search.component";

@Component({
    selector: 'app-details',
    imports: [
        PointAndClickComponent,
        MatIcon,
        MatSelectModule,
        FormsModule,
        CommonModule,
        FindAllComponent,
        ForcedSearchComponent,
        AutoSearchComponent
    ],
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
    route: ActivatedRoute = inject(ActivatedRoute);
    cardService = inject(CardsService);
    stringService = inject(StringUtilsService);
    card: Card;
    cardId: number;
    selectedValue: string = '';
    options = [
        {label: 'point and click', value: 'pointAndClick', disabled: false},
        {label: 'find all', value: 'findAll', disabled: false},
        {label: 'recherche forcée', value: 'forcedSearch', disabled: false},
        {label: 'leçon', value: 'lesson', disabled: true},
        {label: 'recherche par type', value: 'typeSearch', disabled: true},
        {label: 'recherche libre', value: 'autoSearch', disabled: false}
    ];

    constructor(private preferenceService: PreferencesService) {
        this.cardId = Number(this.route.snapshot.params['id']);
        this.card = {id: this.cardId, name: '', type: '', photo: '', appellation: '', country: '', region: '', countryPicture: '', description:''};
    }

    ngOnInit(): void {
        this.cardService.getDetailById(this.cardId).then(
            card => {
                this.card = card;
                this.card.name = this.cardService.getCardNameFromType(card);
                this.card.photo = this.cardService.mapsUrl + '/' + this.stringService.sanitize(card.name) + '.svg'
                this.selectedValue = this.preferenceService.getGameMode() ?? this.options[0].value;
            });
    }

    onGameModeChange(option: string) {
        this.preferenceService.setGameMode(option);
    }
}
