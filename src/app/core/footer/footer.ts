import { Component } from '@angular/core';
import { SharedImports } from '../../material.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SharedImports, RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class Footer {
  year = new Date().getFullYear();
}
