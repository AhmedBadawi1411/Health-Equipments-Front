import { Component } from '@angular/core';
import { SideBarBtn } from "../side-bar-btn/side-bar-btn";
import { Icons } from '../../environment';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  imports: [SideBarBtn],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})
export class SideBar {
  protected readonly Icons = Icons;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
