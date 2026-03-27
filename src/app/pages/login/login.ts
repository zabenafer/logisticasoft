import { Component, inject, DestroyRef } from '@angular/core';
import { SharedImports } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environment';

const LAST_USER_KEY = 'ls_last_user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedImports, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  usuario = '';
  password = '';
  recordarme = false;
  loading = false;
  errorMsg = '';

  // ✅ inyectamos DestroyRef para usarlo en takeUntilDestroyed
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Prefill DEV (solo cuando está activado)
    if (environment.prefillLogin) {
      this.usuario = environment.devLoginUser;
      this.password = environment.devLoginPass;
      this.recordarme = true; // opcional: marcar por defecto en dev
    } else {
      // Si no hay prefill DEV, recuperá el último usuario recordado
      const last = localStorage.getItem(LAST_USER_KEY);
      if (last) {
        this.usuario = last;
        this.recordarme = true;
      }
    }
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef)) // ✅ ya tiene injection context
      .subscribe(params => {
        const reason = params.get('reason');
        this.errorMsg =
          reason === 'session-expired'
            ? 'Tu sesión expiró por inactividad. Iniciá sesión de nuevo.'
            : '';
      });
  }

  onLogin(): void {
    if (!this.usuario || !this.password) return;
    this.loading = true;
    this.errorMsg = '';

    this.auth.login({ usernameOrEmail: this.usuario, password: this.password })
      .subscribe({
        next: res => {
          // Guarda token en localStorage (si recordarme = true) o sessionStorage
          this.auth.setAccessToken(res.accessToken, this.recordarme);

          // Guardar/limpiar último usuario
          if (this.recordarme) localStorage.setItem(LAST_USER_KEY, this.usuario);
          else localStorage.removeItem(LAST_USER_KEY);

          this.router.navigate(['/dashboard']);
        },
        error: err => {
          this.errorMsg = 'Credenciales inválidas';
          console.error(err);
        }
      })
      .add(() => this.loading = false);
  }
}
