import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LoginDialogComponent } from './dialogs/login/login-dialog.component';
import { RegisterDialogComponent } from './dialogs/register/register-dialog.component';
import { NgIf } from '@angular/common';
import { UserService } from '../utils/user.service';

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
    isLoggedIn = false;
    username: string | null = null;

    constructor(private dialog: MatDialog, private userService: UserService) {
        this.updateLoginStatus();
        this.userService.currentUser$.subscribe(() => {
            this.updateLoginStatus();
        });
    }

    private updateLoginStatus() {
        this.isLoggedIn = this.userService.isLoggedIn();
        const user = this.userService.getCurrentUser();
        this.username = user ? user.login : null;
    }

    openLoginDialog() {
        this.dialog.open(LoginDialogComponent);
    }

    openRegisterDialog() {
        this.dialog.open(RegisterDialogComponent);
    }

    logout() {
        this.userService.logout();
    }
}