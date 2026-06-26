import { Component } from '@angular/core';
import { BreadCrump } from "../../../components/bread-crump/bread-crump";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-facilities-layout',
  imports: [BreadCrump, RouterOutlet],
  templateUrl: './facilities-layout.html',
  styleUrl: './facilities-layout.css',
})
export class FacilitiesLayout {

}
