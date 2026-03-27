import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  sidebarCollapsed = false;
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // ❗ Nunca uses window en SSR
    if (this.isBrowser) {
      // Arranca cerrado en mobile
      this.sidebarCollapsed = window.innerWidth <= 768;
    } else {
      // Valor seguro en SSR (sin overlay abierto)
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  closeSidebar() {
    this.sidebarCollapsed = true;
  }
}
