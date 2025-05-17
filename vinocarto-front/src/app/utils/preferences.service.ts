import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  constructor() { }
  private _gameModeSelection: string | null = null;

  setGameMode(option: string) {
    this._gameModeSelection = option;
  }

  getGameMode(): string | null {
    return this._gameModeSelection;
  }
}
