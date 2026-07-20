import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from './pages/login/login';
import { AuthService } from './services/auth-service';
import { ApiResponse } from './interfaces/Response.interface';
import { IUser } from './interfaces/User.interface';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Medical Equipments');
}
