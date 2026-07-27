import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-header',
    imports: [
        RouterLink,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        NgIf,
        MatDialogModule
    ],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    constructor() {
    }
}