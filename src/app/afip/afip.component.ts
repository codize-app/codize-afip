import { Component, OnInit, DoCheck, ViewChild, Inject } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatTable } from '@angular/material/table';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Globals } from '../app.globals';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@ionic-native/file-opener/ngx';

import * as XLSX from 'xlsx-js-style';

export interface InvoiceElement {
  docName: string;
  docNumber: string;
  cae: string;
  cuitEmi: string;
  cuitRec: string;
  nameEmi: string;
  nameRec: string;
  date: string;
  amount: number;
  currency: string;
}

@Component({
  selector: 'app-afip',
  templateUrl: './afip.component.html',
  styleUrls: ['./afip.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AfipComponent implements OnInit {

  invoices: InvoiceElement[] = [];
  displayedColumns: string[] = ['docName', 'docNumber'];
  expandedElement: InvoiceElement | null | undefined;
  @ViewChild(MatTable) table: MatTable<InvoiceElement> | undefined;

  globals = Globals;
  loading = false;
  qrs: any = [];
  qrErrors: any = [];

  constructor(private barcodeScanner: BarcodeScanner, public dialog: MatDialog, private http: HttpClient) { }

  ngOnInit(): void {
    let inv = localStorage.getItem('invoices');
    if (inv) {
      if (JSON.parse(inv).length > 0) {
        this.invoices = JSON.parse(inv);
      }
    }
  }

  ngDoCheck(): void {
    if (this.qrs.length > 0) {
      console.log(this.qrs);
      let res = this.qrs.every((i: any) => {
        return i === false
      });
      if (res) {
        this.loading = false;
        this.qrs.length = 0;
        if (this.qrErrors.length > 0) {
          this.openDialog('Algunos QR de facturas tienen errores y no se pudieron importar masivamente.');
          this.qrErrors.length = 0;
        }
      }
    }
    this.globals = Globals;
  }

  scanQR() {
    this.barcodeScanner.scan({
      formats: 'QR_CODE',
      prompt: 'Coloque un Código QR de AFIP en el Escaner.',
      resultDisplayDuration: 0
    })
    .then(barcodeData => {
      if (barcodeData.cancelled === false) {
        this.processQR(barcodeData.text);
      }
    }).catch(err => {
      alert(err);
    });
  }

  scanQRContinue() {
    this.barcodeScanner.scan({
      formats: 'QR_CODE',
      prompt: 'Coloque un Código QR de AFIP en el Escaner. Puede escanear todas las Facturas AFIP que desee. Al finalizar, oprima en el botón Volver.',
      resultDisplayDuration: 0
    })
    .then(barcodeData => {
      if (barcodeData.cancelled === false) {
        this.qrs.push(barcodeData.text);
        this.scanQRContinue();
      } else {
        this.processQRMassive();
      }
    }).catch(err => {
      alert(err);
    });
  }

  async test() {
    // FA-C
    const urlText1 = "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyMi0wMS0yNSIsImN1aXQiOjIwMzY3MzYyNDczLCJwdG9WdGEiOjIsInRpcG9DbXAiOjExLCJucm9DbXAiOjg4LCJpbXBvcnRlIjoyMDAwLCJtb25lZGEiOiJQRVMiLCJjdHoiOjEsInRpcG9Eb2NSZWMiOjgwLCJucm9Eb2NSZWMiOjMwNzE2NzQzMjk5LCJ0aXBvQ29kQXV0IjoiRSIsImNvZEF1dCI6NzIwNDMzMjQ5NjcwOTl9";
    // FA-A
    const urlText2 = "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOiAxLCAiZmVjaGEiOiAiMjAyMi0wMi0wMSIsICJjdWl0IjogMzA3MTY3MTg1MjksICJwdG9WdGEiOiAyLCAidGlwb0NtcCI6IDEsICJucm9DbXAiOiAxNjcsICJpbXBvcnRlIjogMTgxNTAuMCwgIm1vbmVkYSI6ICJQRVMiLCAiY3R6IjogMS4wLCAidGlwb0NvZEF1dCI6ICJFIiwgImNvZEF1dCI6IDcyMDU5MDA0NTQ5NTc1LCAibnJvRG9jUmVjIjogMjAzNzAzODYwNTcsICJ0aXBvRG9jUmVjIjogODB9";
    // FA-B
    const urlText3 = "https://www.afip.gob.ar/fe/qr/?p=eyJjb2RBdXQiOjcyMDQ2MTkwMDUyNDc3LCJjdHoiOjEsImN1aXQiOjMwNzEwMTE0MTc2LCJmZWNoYSI6IjIwMjItMDEtMjMiLCJpbXBvcnRlIjo2Mzk4LjAwLCJtb25lZGEiOiJQRVMiLCJucm9DbXAiOjEwMDk3OTksIm5yb0RvY1JlYyI6MCwicHRvVnRhIjozMSwidGlwb0NtcCI6NiwidGlwb0NvZEF1dCI6IkUiLCJ0aXBvRG9jUmVjIjo5NiwidmVyIjoxfQ=="
  
    // FA QR Odoo
    const urlText4 = "https://serviciosweb.afip.gob.ar/genericos/comprobantes/cae.aspx?p=eyJ2ZXIiOiAxLCAiZmVjaGEiOiAiMjAyNC0wMy0wMSIsICJjdWl0IjogMzA3MTU1MDg0NjYsICJwdG9WdGEiOiAzLCAidGlwb0NtcCI6IDYsICJucm9DbXAiOiA0NDY5LCAiaW1wb3J0ZSI6IDk4NjAuMCwgIm1vbmVkYSI6ICJQRVMiLCAiY3R6IjogMS4wLCAidGlwb0NvZEF1dCI6ICJFIiwgImNvZEF1dCI6IDc0MDk2MDQ1NDM0MTM2LCAidGlwb0RvY1JlYyI6IDk2LCAibnJvRG9jUmVjIjogMjUxNjI5Nzh9";

    // Massive Import
    /*this.qrs.push(urlText1);
    this.qrs.push(urlText2);
    this.qrs.push(urlText3);
    this.processQRMassive();*/
    this.processQR(urlText4);
  }

  removeInvoices(): void {
    this.invoices.length = 0;
    localStorage.setItem('invoices', JSON.stringify(this.invoices));
  }

  async processQR(t: string) {
    this.loading = true;
    const url = new URL(t);
    const p: any = url.searchParams.get('p');
    let encode = p.replace(/b\'(.*)\'/, '$1').replace(/\n/g, '');
    const decode = decodeURIComponent(escape(atob( encode ))).replace(/\'/g, '"');
    const obj = JSON.parse(decode);
    console.log(obj);
    const httpOptions = {
      headers: new HttpHeaders({ 
        'Access-Control-Allow-Origin':'*',
      })
    };

    if (url.host === 'www.afip.gob.ar' || url.host === 'afip.gob.ar' || url.host === 'serviciosweb.afip.gob.ar') {
      if (this.invoices.find(x => x.cae === obj.codAut) !== undefined) {
        this.openDialog('¡Factura ya escaneada!');
        this.loading = false;
      } else {
        let newinvoice = await this.processQrFeAr(obj);
        this.invoices.push(newinvoice);
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
        setTimeout(() => {
          if (this.table) {
            this.table!.renderRows();
          }
          this.loading = false;
        }, 1);
        /*this.http.get<any>('./tango/Rest/GetContribuyente?cuit=' + obj.cuit, httpOptions).subscribe(dataE => {
          if (dataE.Contribuyente) {
            newinvoice.nameEmi = dataE.Contribuyente.nombre;
            if (obj.nroDocRec !== 0 && obj.nroDocRec.toString().length >= 11) {
              this.http.get<any>('./tango/Rest/GetContribuyente?cuit=' + obj.nroDocRec, httpOptions).subscribe(dataR => {
                if (dataR.Contribuyente) {
                  newinvoice.nameRec = dataR.Contribuyente.nombre;
                  this.invoices.push(newinvoice);
                  localStorage.setItem('invoices', JSON.stringify(this.invoices));
                  if (this.table) {
                    this.table!.renderRows();
                  }
                  this.loading = false;
                } else {
                  console.log(dataR);
                }
              }, (err: any) => {
                console.log(err);
                this.openDialog(JSON.stringify(err));
                this.loading = false;
              });
            } else {
              newinvoice.nameRec = 'Consumidor Final';
              this.invoices.push(newinvoice);
              localStorage.setItem('invoices', JSON.stringify(this.invoices));
              if (this.table) {
                this.table!.renderRows();
              }
              this.loading = false;
            }
          } else {}
        }, (err: any) => {
          console.log(err);
          this.openDialog(JSON.stringify(err));
          this.loading = false;
        });*/
      }
    } else {
      this.openDialog('El QR escaneado no es de AFIP');
      this.loading = false;
    }
  }

  async processQRMassive() {
    this.loading = true;
    for (let i = 0; i < this.qrs.length; i++) {
      const t = this.qrs[i];
      const url = new URL(t);
      const p: any = url.searchParams.get('p');
      let encode = p.replace(/b\'(.*)\'/, '$1').replace(/\n/g, '');
      const decode = decodeURIComponent(escape(atob( encode ))).replace(/\'/g, '"');
      const obj = JSON.parse(decode);

      if (url.host === 'www.afip.gob.ar' || url.host === 'afip.gob.ar') {
        if (this.invoices.find(x => x.cae === obj.codAut) !== undefined) {
          this.qrErrors.push(obj.codAut);
          this.qrs[i] = false;
        } else {
          let newinvoice = await this.processQrFeAr(obj);
          this.invoices.push(newinvoice);
          localStorage.setItem('invoices', JSON.stringify(this.invoices));
          setTimeout(() => {
            if (this.table) {
              this.table!.renderRows();
            }
            this.qrs[i] = false;
          }, 1);
          /*this.http.get<any>('https://afip.tangofactura.com/Rest/GetContribuyenteFull?cuit=' + obj.cuit,{}).subscribe(dataE => {
            if (dataE.Contribuyente) {
              newinvoice.nameEmi = dataE.Contribuyente.nombre;
              if (obj.nroDocRec !== 0) {
                this.http.get<any>('https://afip.tangofactura.com/Rest/GetContribuyenteFull?cuit=' + obj.nroDocRec,{}).subscribe(dataR => {
                  if (dataR.Contribuyente) {
                    newinvoice.nameRec = dataR.Contribuyente.nombre;
                    this.invoices.push(newinvoice);
                    localStorage.setItem('invoices', JSON.stringify(this.invoices));
                    if (this.table) {
                      this.table!.renderRows();
                    }
                    this.qrs[i] = false;
                  } else {}
                }, (err: any) => {
                  this.qrs[i] = false;
                  this.qrErrors.push(obj.codAut);
                });
              } else {
                newinvoice.nameRec = 'Consumidor Final';
                this.invoices.push(newinvoice);
                localStorage.setItem('invoices', JSON.stringify(this.invoices));
                if (this.table) {
                  this.table!.renderRows();
                }
                this.qrs[i] = false;
              }
            } else {}
          }, (err: any) => {
            this.qrs[i] = false;
            this.qrErrors.push(obj.codAut);
          });*/
        }
      } else {
        this.qrs[i] = false;
        this.qrErrors.push('QR no es de AFIP');
      }
    }
  }

  processQrFeAr(obj: any): any {
    if (obj.ver === '1' || obj.ver === 1) {
      let comp = '';

      switch (obj.tipoCmp) {
        case 1:
          comp = 'FA-A';
          break;
        case 2:
          comp = 'ND-A';
          break;
        case 3:
          comp = 'NC-A';
          break;
        case 4:
          comp = 'RE-A';
          break;
        case 6:
          comp = 'FA-B';
          break;
        case 7:
          comp = 'ND-B';
          break;
        case 8:
          comp = 'NC-B';
          break;
        case 9:
          comp = 'RE-B';
          break;
        case 11:
          comp = 'FA-C';
          break;
        case 12:
          comp = 'ND-C';
          break;
        case 13:
          comp = 'NC-C';
          break;
        case 15:
          comp = 'RE-C';
          break;
        case 19:
          comp = 'FA-E';
          break;
        case 51:
          comp = 'FA-M';
          break;
        case 201:
          comp = 'FCE-A';
          break;
        case 206:
          comp = 'FCE-B';
          break;
        case 211:
          comp = 'FCE-C';
          break;
        default:
          comp = '-';
          break;
      }

      let pdv = obj.ptoVta.toLocaleString('es-AR', {minimumIntegerDigits: 5,useGrouping: false});
      let num = obj.nroCmp.toLocaleString('es-AR', {minimumIntegerDigits: 8,useGrouping: false});
      let nameEmi = '';
      let nameRec = '';

      return {
        docName: comp,
        docNumber: pdv + '-' + num,
        cae: obj.codAut,
        cuitEmi: obj.cuit,
        cuitRec: obj.nroDocRec,
        nameEmi: '',
        nameRec: '',
        date: obj.fecha,
        amount: obj.importe,
        currency: obj.moneda
      };
    }
  }

  async exportToCSV() {
    let csvContent = '';
    let amount = 0;
    let amount_iva = 0;

    csvContent += 'Tipo,Nro,CAE,Emisor,Emisor CUIT,Receptor,Receptor CUIT,Fecha,Importe,Importe sin IVA 21,Moneda\r\n';

    this.invoices.forEach((row) => {
      csvContent += row.docName + ',' + row.docNumber + ',' + row.cae + ',' + row.nameEmi + ',' + row.cuitEmi + ',' + row.nameRec + ',' + row.cuitRec + ',' + row.date + ',' + row.amount + ',' + (Number(row.amount) / 1.21).toFixed(2) + ',' + row.currency + '\r\n';
      amount = amount + Number(row.amount);
      amount_iva = amount_iva + (Number(row.amount) / 1.21);
    });

    csvContent += ',,,,,,,,' + amount + ',' + amount_iva.toFixed(2) + ',\r\n';

    let date = new Date()
    let day = `${(date.getDate())}`.padStart(2,'0');
    let month = `${(date.getMonth()+1)}`.padStart(2,'0');
    let year = date.getFullYear();

    // Method for save in Documents only
    /*const result = await Filesystem.writeFile({
      path: 'invoices_afip_' + `${year}${month}${day}` + '.csv',
      data: csvContent,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });*/

    // Save and Open the file with Data (better option in android actually)
    const blob = new Blob([csvContent], { type: "text/csv" });
    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async function () {
        var base64data = reader.result;
        try {
            const result = await Filesystem.writeFile({
                path: 'invoices_afip_' + `${year}${month}${day}` + '.csv',
                data: <string>base64data,
                directory: Directory.Data,
                recursive: true
            });
            let fileOpener: FileOpener = new FileOpener();
            fileOpener.open(result.uri, blob.type)
                .then(() => console.log('File open'))
                .catch(e => console.log('Error to open file', e));
            console.log('File write', result.uri);
        } catch (e) {
            console.error('Error to write file', e);
        }
    }
  }

  async exportToXLSX() {
    let json: any = [];
    let date = new Date()
    let day = `${(date.getDate())}`.padStart(2,'0');
    let month = `${(date.getMonth()+1)}`.padStart(2,'0');
    let year = date.getFullYear();

    var wscols = [
      {wch:5},
      {wch:15},
      {wch:20},
      {wch:30},
      {wch:12},
      {wch:30},
      {wch:12},
      {wch:15},
      {wch:20},
      {wch:20},
      {wch:10}
    ];

    let amount = 0;
    let amount_iva = 0;

    this.invoices.forEach((row) => {
      const date = new Date(row.date);
      json.push({
        'Tipo': row.docName,
        'Nro': row.docNumber,
        'CAE': row.cae,
        'Emisor': row.nameEmi,
        'Emisor CUIT': row.cuitEmi,
        'Receptor': row.nameRec,
        'Receptor CUIT': row.cuitRec,
        'Fecha': date.toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        'Importe': row.amount,
        'Importe sin IVA 21': Number((Number(row.amount) / 1.21).toFixed(2)),
        'Moneda': row.currency,
      });

      amount = amount + Number(row.amount);
      amount_iva = amount_iva + (Number(row.amount) / 1.21);
    });

    json.push({
      'Tipo': '',
      'Nro': '',
      'CAE': '',
      'Emisor': '',
      'Emisor CUIT': '',
      'Receptor': '',
      'Receptor CUIT': '',
      'Fecha': '',
      'Importe': amount,
      'Importe sin IVA 21': Number(amount_iva.toFixed(2)),
      'Moneda': '',
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    worksheet['!cols'] = wscols;
    const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};

    const letters = 'ABCDEFGHIJK';

    for (let i = 0; i < letters.length; i++) {
      worksheet[letters[i] + "1"].s = {
        font: {
          bold: true,
        },
      };
    }

    for (let i = 2; i < this.invoices.length + 3; i++) {
      worksheet["I" + (i)].s = {
        numFmt: '$#.###,##'
      };
      worksheet["J" + (i)].s = {
        numFmt: '$#.###,##'
      };
    }

    var wbout = XLSX.write(workbook, {bookType:'xlsx',  type: 'binary'});

    let b = new Blob([this.s2ab(wbout)],{type:"application/vnd.ms-excel"});

    var reader = new FileReader();
    reader.readAsDataURL(b);
    reader.onloadend = async function () {
        var base64data = reader.result;
        try {
            const result = await Filesystem.writeFile({
                path: 'invoices_afip_' + `${year}${month}${day}` + '.csv',
                data: <string>base64data,
                directory: Directory.Data,
                recursive: true
            });
            let fileOpener: FileOpener = new FileOpener();
            fileOpener.open(result.uri, 'application/vnd.ms-excel')
                .then(() => console.log('File open'))
                .catch(e => alert('Error to open file ' + JSON.stringify(e)));
            console.log('File write', result.uri);
        } catch (e) {
            alert('Error to write file ' + e);
        }
    }

    /*var link = document.createElement('a');
    link.href = window.URL.createObjectURL(b);
    link.download = 'demo.xlsx';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);*/
  }

  s2ab(s: any) { 
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
    return buf;    
  }

  openDialog(msg: string) {
    const dialogRef = this.dialog.open(DialogContent, {
      data: msg,
    });

    dialogRef.afterClosed().subscribe(result => {});
  }

}

@Component({
  selector: 'dialog-data',
  templateUrl: './dialog.html',
})
export class DialogContent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}
}