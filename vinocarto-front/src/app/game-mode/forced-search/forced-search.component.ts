import {
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    SimpleChanges,
    ViewEncapsulation,
    ChangeDetectorRef,
    OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatInput, MatSuffix } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StringUtilsService } from '../../utils/string-utils.service';
import { GAME_CONFIG } from '../../utils/game-config';

@Component({
    selector: 'forced-search',
    imports: [
        CommonModule,
        MatIcon,
        MatButtonModule,
        MatCardModule,
        MatListModule,
        MatInput,
        MatSuffix,
        ReactiveFormsModule,
        MatFormFieldModule,
        FormsModule,
    ],
    templateUrl: './forced-search.component.html',
    styleUrls: ['./forced-search.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ForcedSearchComponent implements OnChanges, OnDestroy {
    @Input() svgPath!: string;

    pointsPerZone: number = GAME_CONFIG.POINTS_PER_ZONE;
    errorPenalty: number = GAME_CONFIG.ERROR_PENALTY;
    timePenalty: number = GAME_CONFIG.TIME_PENALTY;

    svgContent: SafeHtml = '';
    hoveredLabel: string | null = null;
    gameStarted = false;
    gamePaused = false;
    gameEnded = false;
    gameWon = false;
    displayAnswer = false;
    displayedAnswer = '';
    elapsedTime: number = 0;
    showConfetti = false;
    confettiArray: { left: number; color: string; delay: number }[] = [];
    private timerInterval: number | null = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    score = 0;
    private labelMap = new Map<string, { labels: string[]; paths: SVGPathElement[] }>();
    private rawToSanitizedLabelMap = new Map<string, string>();
    private rawLabelMap = new Map<string, string[]>();
    remainingLabels: string[] = [];
    searchLabel: string = '';
    errorCount = 0;
    appellationErrorCount = 0;
    enteredLabel: string = '';
    allLabels: string[] = [];
    private colorMap: { [key: number]: string } = {
        0: '#00C853',
        1: '#FFB300',
        2: '#EF6C00',
        3: '#D50000'
    };

    private audioContext: AudioContext | null = null;
    private popSoundBuffer: AudioBuffer | null = null;

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer,
        private el: ElementRef,
        private renderer: Renderer2,
        private stringUtils: StringUtilsService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['svgPath'] && changes['svgPath'].currentValue) {
            this.loadSvg();
        }
    }

    ngOnDestroy() {
        this.stopTimer();
        if (this.audioContext) {
            this.audioContext.close().catch((err) => console.error('Erreur lors de la fermeture de AudioContext:', err));
            this.audioContext = null;
        }
    }

    private async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const response = await fetch('assets/sounds/pop.wav');
            if (!response.ok) throw new Error('Erreur lors du chargement du fichier WAV');
            const arrayBuffer = await response.arrayBuffer();
            this.popSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (err) {
            console.error('Erreur lors du chargement du son:', err);
        }
    }

    private playPopSound() {
        if (this.audioContext && this.popSoundBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.popSoundBuffer;
            source.connect(this.audioContext.destination);
            source.start();
        } else {
            console.warn('Son non reproduit: audioContext ou popSoundBuffer non initialisés');
        }
    }

    private loadSvg() {
        this.http.get(this.svgPath, { responseType: 'text' }).subscribe({
            next: (svg) => {
                this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                setTimeout(() => this.setupListeners(), 200);
            },
            error: (err) => {
                console.error(`Erreur lors du chargement du SVG: ${this.svgPath}`, err);
                this.svgContent = '';
            },
        });
    }

    private setupListeners() {
        const svgWrapper: HTMLElement = this.el.nativeElement.querySelector('.svg-wrapper');
        if (!svgWrapper) {
            console.error('Wrapper SVG non trouvé');
            return;
        }

        const allPaths = svgWrapper.querySelectorAll('path.clickable-region');
        if (!allPaths.length) {
            console.error('No clickable regions found in SVG');
            return;
        }

        allPaths.forEach((path, index) => {
            const rawLabel = path.getAttribute('data-label');
            if (!rawLabel) return;

            const labels = rawLabel.split(',').map(l => this.stringUtils.sanitize(l.trim()));
            const rawLabels = rawLabel.split(',').map(l => l.trim());
            const pathKey = `path_${index}`;
            this.labelMap.set(pathKey, { labels, paths: [path as SVGPathElement] });
            this.rawLabelMap.set(pathKey, rawLabels);
            labels.forEach(sanitizedLabel => {
                this.rawToSanitizedLabelMap.set(sanitizedLabel, pathKey);
            });
        });

        this.labelMap.forEach((entry, pathKey) => {
            entry.paths.forEach((path) => {
                this.renderer.listen(path, 'mouseenter', () => {
                    entry.paths.forEach((p) => this.renderer.setStyle(p, 'opacity', '0.5'));
                    this.hoveredLabel = this.rawLabelMap.get(pathKey)?.[0] || entry.labels[0];
                });

                this.renderer.listen(path, 'mouseleave', () => {
                    entry.paths.forEach((p) => this.renderer.removeStyle(p, 'opacity'));
                    this.hoveredLabel = null;
                });
            });
        });
    }

    startGame() {
        this.gameStarted = true;
        this.gamePaused = false;
        this.gameEnded = false;
        this.gameWon = false;
        this.elapsedTime = 0;
        this.startTimestamp = Date.now();
        this.pauseOffset = 0;
        this.errorCount = 0;
        this.appellationErrorCount = 0;
        this.score = 0;
        this.searchLabel = '';
        this.enteredLabel = '';
        this.displayAnswer = false;
        this.displayedAnswer = '';
        this.initializeAudio();
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.allLabels = Array.from(this.labelMap.keys());
        this.labelMap.forEach((entry) => {
            entry.paths.forEach((path) => {
                const currentFill = path.getAttribute('fill');
                this.renderer.setAttribute(path, 'fill', currentFill && currentFill !== 'none' ? currentFill : '#9E9E9E');
                path.setAttribute('opacity', '0.2');
                path.style.opacity = '0.2';
            });
        });
        this.proposeNewZone();
    }

    pauseGame() {
        this.gamePaused = true;
        this.stopTimer();
        this.pauseOffset += Date.now() - this.startTimestamp;
    }

    resumeGame() {
        this.gamePaused = false;
        this.startTimestamp = Date.now();
        this.startTimerLoop();
    }

    endGame() {
        this.stopTimer();
        this.pauseOffset += Date.now() - this.startTimestamp;
        this.gameEnded = true;
        if (this.remainingLabels.length === 0) {
            this.gameWon = true;
            this.calculateScore();
            this.playPopSound();
            this.triggerConfetti();
            this.resetSvg();
        }
    }

    private resetSvg() {
        this.labelMap.forEach((entry) => {
            entry.paths.forEach((path) => {
                this.renderer.setAttribute(path, 'fill', '#9E9E9E');
                path.setAttribute('opacity', '0.2');
                path.style.cssText = '';
                path.classList.add('clickable-region');
                path.classList.remove('blinking');
                path.classList.remove('validated');
            });
        });
    }

    clearGame() {
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameEnded = false;
        this.gameWon = false;
        this.elapsedTime = 0;
        this.startTimestamp = 0;
        this.pauseOffset = 0;
        this.errorCount = 0;
        this.appellationErrorCount = 0;
        this.score = 0;
        this.searchLabel = '';
        this.enteredLabel = '';
        this.displayAnswer = false;
        this.displayedAnswer = '';
        this.stopTimer();
        this.resetSvg();
    }

    replayGame() {
        this.clearGame();
        this.startGame();
    }

    submitValue(enteredLabel: string) {
        this.enteredLabel = this.stringUtils.sanitize(enteredLabel);
        if (this.gameStarted && !this.gamePaused) {
            const sanitizedSearchLabel = this.stringUtils.sanitize(this.searchLabel);
            const pathKey = this.rawToSanitizedLabelMap.get(this.enteredLabel);
            const searchPathKey = this.rawToSanitizedLabelMap.get(sanitizedSearchLabel);
            if (pathKey && pathKey === searchPathKey) {
                const entry = this.labelMap.get(pathKey);
                if (entry) {
                    entry.paths.forEach((path) => {
                        path.removeAttribute('style');
                        this.renderer.setAttribute(path, 'fill', this.colorMap[this.appellationErrorCount]);
                        path.style.cssText = `fill: ${this.colorMap[this.appellationErrorCount]} !important; animation: none !important`;
                        path.setAttribute('opacity', '1');
                        path.style.opacity = '1';
                        path.classList.remove('blinking');
                        path.classList.add('validated');
                    });
                    this.remainingLabels = this.remainingLabels.filter((l) => l !== pathKey);
                    this.appellationErrorCount = 0;
                    this.enteredLabel = '';
                    this.calculateScore();
                    if (this.remainingLabels.length === 0) {
                        this.endGame();
                    } else {
                        this.proposeNewZone();
                    }
                }
            } else {
                this.errorCount++;
                this.appellationErrorCount++;
                this.calculateScore();
                if (this.appellationErrorCount >= 3) {
                    const entry = this.labelMap.get(searchPathKey!);
                    if (entry) {
                        entry.paths.forEach((path) => {
                            path.removeAttribute('style');
                            this.renderer.setAttribute(path, 'fill', this.colorMap[3]);
                            path.style.cssText = `fill: ${this.colorMap[3]} !important; animation: none !important`;
                            path.setAttribute('opacity', '1');
                            path.style.opacity = '1';
                            path.classList.remove('blinking');
                            path.classList.add('validated');
                        });
                        this.displayedAnswer = this.rawLabelMap.get(searchPathKey!)?.[0] || this.searchLabel;
                        this.displayAnswer = true;
                        const isLastZone = this.remainingLabels.length === 1;
                        this.remainingLabels = this.remainingLabels.filter((l) => l !== searchPathKey);
                        this.calculateScore();
                        if (isLastZone) {
                            this.waitThreeSeconds().then(() => {
                                this.displayAnswer = false;
                                this.displayedAnswer = '';
                                this.endGame();
                            });
                        } else {
                            this.waitThreeSeconds().then(() => {
                                this.displayAnswer = false;
                                this.displayedAnswer = '';
                            });
                            if (this.remainingLabels.length === 0) {
                                this.endGame();
                            } else {
                                this.proposeNewZone();
                            }
                        }
                        this.appellationErrorCount = 0;
                    }
                }
                this.enteredLabel = '';
            }
        }
    }

    private calculateScore() {
        const zonesFound = this.allLabels.length - this.remainingLabels.length;
        this.score =
            zonesFound * GAME_CONFIG.POINTS_PER_ZONE -
            this.errorCount * GAME_CONFIG.ERROR_PENALTY -
            Math.floor(this.elapsedTime / 1000) * GAME_CONFIG.TIME_PENALTY;
        this.cdr.detectChanges();
    }

    private proposeNewZone() {
        if (this.remainingLabels.length > 0) {
            this.labelMap.forEach((entry) => {
                entry.paths.forEach((path) => path.classList.remove('blinking'));
            });
            const nextPathKey = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
            const entry = this.labelMap.get(nextPathKey);
            const rawLabel = Array.from(this.rawToSanitizedLabelMap.entries()).find(([, pathKey]) => pathKey === nextPathKey)?.[0];
            this.searchLabel = rawLabel?.split(',')[0].trim() || entry?.labels[0] || nextPathKey;
            if (entry) {
                entry.paths.forEach((path) => {
                    path.classList.add('blinking');
                    path.setAttribute('opacity', '1');
                    path.style.opacity = '1';
                });
            } else {
                console.error(`No paths found for path key: ${nextPathKey}`);
            }
        }
    }

    private startTimerLoop() {
        this.stopTimer();
        this.startTimestamp = Date.now();
        this.timerInterval = window.setInterval(() => {
            const now = Date.now();
            this.elapsedTime = now - this.startTimestamp + this.pauseOffset;
            this.calculateScore();
            this.cdr.detectChanges();
        }, 1000);
    }

    private stopTimer() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private triggerConfetti() {
        this.confettiArray = Array.from({ length: 30 }, () => ({
            left: Math.random() * 100,
            color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`,
            delay: Math.random() * 1.5,
        }));

        this.showConfetti = true;

        setTimeout(() => {
            this.showConfetti = false;
            this.confettiArray = [];
        }, 3000);
    }

    private waitThreeSeconds(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 3000));
    }
}