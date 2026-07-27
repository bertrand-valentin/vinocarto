import { Component, inject, OnInit } from '@angular/core';
import { CardComponent } from "../card/card.component";
import { Card } from "../card";
import { NgForOf, NgIf } from "@angular/common";
import { CardsService } from "../utils/cards.service";
import { StringUtilsService } from "../utils/string-utils.service";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CardComponent,
        NgForOf, NgIf,
        FormsModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatFormFieldModule
    ],
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

    // PWA install prompt state
    deferredPrompt: any = null;
    showInstallPrompt = false;
    installed = false;

    ngOnInit() {
        // Listen for the PWA install prompt
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            this.deferredPrompt = e as any;
            this.showInstallPrompt = true;
        });

        // Detect installation
        window.addEventListener('appinstalled', () => {
            this.installed = true;
            this.showInstallPrompt = false;
            this.deferredPrompt = null;
        });

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

    onInstallClicked() {
        if (!this.deferredPrompt) {
            return;
        }
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                this.installed = true;
            }
            this.deferredPrompt = null;
            this.showInstallPrompt = false;
        }).catch((err: any) => {
            console.error('install prompt error', err);
            this.deferredPrompt = null;
            this.showInstallPrompt = false;
        });
    }

    onDismissInstall() {
        this.showInstallPrompt = false;
    }

    toggleSortDirection() {
        this.sortAsc = !this.sortAsc;
        this.applyFilter();
    }

    applyFilter() {
        const text = this.stringService.sanitize(this.searchText).toLowerCase();
        this.filteredCardList = this.cardList
            .filter(card => {
                const name = this.stringService.sanitize(card.name).toLowerCase();
                const region = this.stringService.sanitize(card.region).toLowerCase();
                const country = this.stringService.sanitize(card.country).toLowerCase();
                const appellation = this.stringService.sanitize(card.appellation).toLowerCase();
                return name.includes(text) || region.includes(text) || country.includes(text) || appellation.includes(text);
            })
            .sort((a, b) => {
                const valA = (a[this.sortField] || '').toString().toLowerCase();
                const valB = (b[this.sortField] || '').toString().toLowerCase();
                return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
    }
}