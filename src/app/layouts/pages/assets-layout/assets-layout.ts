import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreadCrump } from "../../../components/bread-crump/bread-crump";

@Component({
  selector: 'app-assets-layout',
  imports: [RouterOutlet, BreadCrump, RouterLink, RouterLinkActive],
  templateUrl: './assets-layout.html',
  styleUrl: './assets-layout.css',
})
export class AssetsLayout {

}
