import { Component } from '@angular/core';
import { SharedImports } from '../../material.module';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class Footer {

  year = new Date().getFullYear();

}
