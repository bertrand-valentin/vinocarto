import {Component} from '@angular/core';
import {HeaderComponent} from './header/header.component';
import {RouterModule} from '@angular/router';
import {FooterComponent} from "./footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'vinocarto';
}
