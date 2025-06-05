import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../utils/user.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-register-dialog',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        NgIf
    ],
    templateUrl: './register-dialog.component.html',
    styleUrls: ['./register-dialog.component.scss']
})
export class RegisterDialogComponent implements AfterViewInit {
    login = '';
    password = '';
    errorMessage = '';
    @ViewChild('loginInput') loginInput!: ElementRef;

    constructor(
        private dialogRef: MatDialogRef<RegisterDialogComponent>,
        private userService: UserService
    ) {}

    ngAfterViewInit() {
        this.loginInput.nativeElement.focus();
        console.log('Register dialog initialized');
    }

    submitRegister() {
        if (!this.login || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs de texte';
            console.log('Validation failed: empty fields');
            return;
        }
        this.errorMessage = '';
        console.log('Attempting registration for:', this.login);
        this.userService.register(this.login, this.password).subscribe({
            next: (user: any) => {
                console.log('Registration successful:', user);
                this.dialogRef.close(user);
            },
            error: (err: { status: number; }) => {
                console.log('Registration error:', err);
                this.errorMessage = err.status === 400 ? 'Utilisateur déjà existant' : 'Erreur d’inscription';
            }
        });
    }

    cancel() {
        console.log('Register dialog cancelled');
        this.dialogRef.close(null);
    }
}