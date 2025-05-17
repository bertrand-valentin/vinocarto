import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'find-all',
  imports: [CommonModule],
  templateUrl: './find-all.component.html',
  styleUrls: ['./find-all.component.scss']
})
export class FindAllComponent implements OnChanges {

  @Input() svgPath!: string;
  svgContent: SafeHtml = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['svgPath'] && changes['svgPath'].currentValue) {
      console.log(`Chargement du SVG: ${this.svgPath}`);
      this.loadSvg();
    }
  }

  private loadSvg() {
    this.http.get(this.svgPath, { responseType: 'text' }).subscribe({
      next: (svg) => {
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
      },
      error: (err) => {
        console.error(`Erreur lors du chargement du SVG: ${this.svgPath}`, err);
        this.svgContent = '';
      }
    });
  }

}
