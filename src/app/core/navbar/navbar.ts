import { Component } from '@angular/core';
import { SharedImports } from '../../material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [SharedImports, RouterModule],
  standalone: true,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
}
