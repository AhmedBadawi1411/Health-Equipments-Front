import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { ApiResponse } from '../../interfaces/Response.interface';

@Component({
  selector: 'app-login',
  imports: [
    MessageModule,
    FormsModule,
    ReactiveFormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected email: string = '';
  protected password: string = '';
  protected errorMessage: string = '';
  loading = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  protected login() {
    this.loading.set(true);
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.errorMessage = error.error.message;
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }
}
