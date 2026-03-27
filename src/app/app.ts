import { Component, ElementRef, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/navbar/navbar';
import { filter } from 'rxjs';
import { Footer } from "./core/footer/footer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, Footer],
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('logisticasoft-frontend');

  constructor(private router: Router, private host: ElementRef<HTMLElement>) {
  this.router.events.pipe(filter(e => e instanceof NavigationEnd))
    .subscribe(() => {
      const url = this.router.url.split('?')[0];
      const noOffset = url === '/login' || url.startsWith('/home'); // ajustá a gusto
      this.host.nativeElement.querySelector('.app-main')
        ?.classList.toggle('no-offset', noOffset);
    });
}
}

