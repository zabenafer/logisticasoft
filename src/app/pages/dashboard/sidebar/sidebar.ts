import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SharedImports } from '../../../material.module';
import { ClerkAuthService } from '../../../auth/clerk-auth.service';
import { AuthSessionService } from '../../../auth/auth-session.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SharedImports],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<void>();

  logoutLoading = false;

  constructor(
    private clerkAuth: ClerkAuthService,
    private session: AuthSessionService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.toggle.emit(!this.collapsed);
  }

  onItemClick() {
    this.itemSelected.emit();
  }

  async onLogout(ev: Event) {
    ev.preventDefault();

    if (this.logoutLoading) {
      return;
    }

    this.logoutLoading = true;

    try {
      await this.clerkAuth.signOut();
      this.session.clear();
      sessionStorage.removeItem('ls_portal_intent');
      await this.router.navigate(['/home']);
    } finally {
      this.logoutLoading = false;
    }
  }
}
