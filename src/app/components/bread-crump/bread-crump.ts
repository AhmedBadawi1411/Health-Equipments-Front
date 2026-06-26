import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadCrumpLabelMap } from './label-map';
import { filter } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-bread-crump',
  imports: [BreadcrumbModule],
  templateUrl: './bread-crump.html',
  styleUrl: './bread-crump.css',
})
export class BreadCrump implements OnInit {
  items: MenuItem[] = [];
  itemsMap = BreadCrumpLabelMap;
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.buildBreadcrumb();
    });
  }

  buildBreadcrumb() {
    const url = this.router.url;

    
    const segments = url.split('/').filter(Boolean);
    
    this.items = segments.map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/');
      console.log(path);
      return {
        label: this.itemsMap[path] || segment,
        routerLink: '/' + arr.slice(0, index + 1).join('/'),
      };
    });
  }
}
