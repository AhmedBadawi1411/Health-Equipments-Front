import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreadCrump } from '../../../components/bread-crump/bread-crump';

@Component({
  selector: 'app-users-layout',
  standalone: true,
  imports: [RouterOutlet, BreadCrump],
  templateUrl: './users-layout.html',
  styleUrl: './users-layout.css',
})
export class UsersLayout {}
