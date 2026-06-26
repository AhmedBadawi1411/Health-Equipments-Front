import { Component } from '@angular/core';
import { BreadCrump } from '../../../components/bread-crump/bread-crump';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-needs-layout',
  imports: [BreadCrump, RouterOutlet],
  templateUrl: './needs-layout.html',
  styleUrl: './needs-layout.css',
})
export class NeedsLayout {}
