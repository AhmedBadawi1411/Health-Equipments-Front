import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SideBarBtn } from "../side-bar-btn/side-bar-btn";
import { Icons } from '../../environment';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-bar',
  imports: [SideBarBtn, CommonModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})
export class SideBar {
  protected readonly Icons = Icons;

  @Input() isMinimized = false;
  @Output() isMinimizedChange = new EventEmitter<boolean>();

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.isMinimizedChange.emit(this.isMinimized);
  }

  constructor(
    public readonly authService: AuthService,
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
