import { Component } from '@angular/core';
import { Globals } from './app.globals';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'codize-afip';

  globals = Globals;

}
