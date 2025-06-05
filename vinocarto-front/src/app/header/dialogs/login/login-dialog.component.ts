import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../utils/user.service';
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-login-dialog',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        NgIf
    ],
    templateUrl: './login-dialog.component.html',
    styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements AfterViewInit {
    login = '';
    password = '';
    errorMessage = '';
    @ViewChild('loginInput') loginInput!: ElementRef;

    constructor(
        private dialogRef: MatDialogRef<LoginDialogComponent>,
        private userService: UserService
    ) {}

    ngAfterViewInit() {
        this.loginInput.nativeElement.focus();
    }

    submitLogin() {
        if (!this.login || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs';
            console.log('Validation failed: empty fields');
            return;
        }
        this.errorMessage = '';
        console.log('Attempting login for:', this.login);
        this.userService.login(this.login, this.password).subscribe({
            next: (user) => {
                console.log('Login successful:', user);
                this.dialogRef.close(user);
            },
            error: (err) => {
                console.log('Login error:', err);
                this.errorMessage = err.status === 400 ? 'Identifiants incorrects' : 'Erreur de connexion';
            }
        });
    }

    cancel() {
        console.log('Login dialog cancelled');
        this.dialogRef.close(null);
    }
}