import {Component} from '@angular/core';
import {HomeComponent} from './home/home.component';
import {HeaderComponent} from './header/header.component';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [HomeComponent, HeaderComponent, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'home';
}
