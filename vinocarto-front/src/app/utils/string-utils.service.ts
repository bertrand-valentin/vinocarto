import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StringUtilsService {

  constructor() { }

  sanitize(str: string) {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-\s\u00A0]+/g, '')
        .toLowerCase();
  }
}
