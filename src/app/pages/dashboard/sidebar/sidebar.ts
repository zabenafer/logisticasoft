import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SharedImports } from '../../../material.module';
import { AuthService } from '../../../auth/auth.service';

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

  constructor(private auth: AuthService, private router: Router) {}

  // Pedimos el cambio al padre (no tocamos estado local directamente)
  toggleSidebar() {
    this.toggle.emit(!this.collapsed);
  }

  onItemClick() {
    this.itemSelected.emit(); // el padre cierra
  }

  onLogout(ev: Event) {
    ev.preventDefault();
    if (this.logoutLoading) return;
    this.logoutLoading = true;

    this.auth.logout()
      .subscribe({
        next: () => {
          // tokens ya se limpiaron en AuthService.logout()
          this.router.navigate(['/login']); 
        },
        error: () => {
          // aunque falle el POST, ya borramos el access en el front:
          this.router.navigate(['/login']);
        }
      })
      .add(() => this.logoutLoading = false);
  }
}
