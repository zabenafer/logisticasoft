import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SharedImports } from '../../../material.module';
import { AuthService } from '../../../auth/auth.service';
import { ClerkAuthService } from '../../../auth/clerk-auth.service';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthSessionService } from '../../../auth/auth-session.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SharedImports],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  @Input()  collapsed = false;              // <-- controlado por el padre
  @Output() toggle = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<void>();

  logoutLoading = false;

  constructor(  private auth: AuthService,
                private clerkAuth: ClerkAuthService,
                private session: AuthSessionService,
                private router: Router) {}

  // Pedimos el cambio al padre (no tocamos estado local directamente)
  toggleSidebar() {
    this.toggle.emit(!this.collapsed);
  }

  onItemClick() {
    this.itemSelected.emit(); // el padre cierra
  }

  async onLogout(ev: Event) {
    ev.preventDefault();

    if (this.logoutLoading) return;

    this.logoutLoading = true;

    try {
      // 1. Cierra sesión local: limpia accessToken y revoca refresh cookie si existe
      await firstValueFrom(
        this.auth.logout().pipe(
          catchError(() => of(null))
        )
      );

      // 2. Cierra sesión Clerk/Google si existe
      await this.clerkAuth.signOut();

      this.session.clear();

      // 3. Limpia datos auxiliares del portal
      sessionStorage.removeItem('ls_portal_intent');

      // 4. Vuelve al home para elegir portal
      await this.router.navigate(['/home']);

    } finally {
      this.logoutLoading = false;
    }
  }
}
