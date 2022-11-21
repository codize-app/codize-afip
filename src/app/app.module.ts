import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { registerLocaleData } from '@angular/common';
import locale from '@angular/common/locales/es-AR';
import localeExtra from '@angular/common/locales/extra/es-AR';

registerLocaleData(locale, 'es-AR', localeExtra);

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

import { AfipComponent } from './afip/afip.component';
import { DialogContent } from './afip/afip.component';

const routes: Routes = [
  { path: 'home', component: AfipComponent },
  { path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    AfipComponent,
    DialogContent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    FormsModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatInputModule
  ],
  providers: [BarcodeScanner, FileOpener],
  bootstrap: [AppComponent]
})
export class AppModule { }
