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
    private labelMap = new Map<string, SVGPathElement[]>();
    private rawToSanitizedLabelMap = new Map<string, string>();
    remainingLabels: string[] = [];
    searchLabel: string = '';
    errorCount = 0;
    appellationErrorCount = 0;
    enteredLabel: string = '';
    allLabels: string[] = [];
    private colorMap: { [key: number]: string } = {
        0: '#00C853', // Verde (0 erreur)
        1: '#FFB300', // Jaune (1 erreur)
        2: '#EF6C00', // Orange (2 erreurs)
        3: '#D50000', // Rouge (3 erreurs)
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

        allPaths.forEach((path) => {
            const rawLabel = path.getAttribute('data-label');
            if (!rawLabel) return;

            const sanitizedLabel = this.stringUtils.sanitize(rawLabel);

            if (!this.labelMap.has(sanitizedLabel)) {
                this.labelMap.set(sanitizedLabel, []);
            }
            this.labelMap.get(sanitizedLabel)!.push(path as SVGPathElement);
            this.rawToSanitizedLabelMap.set(rawLabel, sanitizedLabel);
        });

        this.labelMap.forEach((paths, label) => {
            paths.forEach((path) => {
                this.renderer.listen(path, 'mouseenter', () => {
                    paths.forEach((p) => this.renderer.setStyle(p, 'opacity', '0.5'));
                    this.hoveredLabel = label;
                });

                this.renderer.listen(path, 'mouseleave', () => {
                    paths.forEach((p) => this.renderer.removeStyle(p, 'opacity'));
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
        this.labelMap.forEach((paths) => {
            paths.forEach((path) => {
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
        this.labelMap.forEach((paths) => {
            paths.forEach((path) => {
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
          if (this.enteredLabel === sanitizedSearchLabel) {
               const paths = this.labelMap.get(this.enteredLabel);
                if (paths) {
                    paths.forEach((path) => {
                      path.removeAttribute('style');
                        this.renderer.setAttribute(path, 'fill', this.colorMap[this.appellationErrorCount]);
                        path.style.cssText = `fill: ${this.colorMap[this.appellationErrorCount]} !important; animation: none !important`;
                        path.setAttribute('opacity', '1');
                        path.style.opacity = '1';
                        path.classList.remove('blinking');
                        path.classList.add('validated');
                    });
                } else {
                    console.error(`No paths found for sanitized label: ${this.enteredLabel}`);
                }
                this.appellationErrorCount = 0;
                this.remainingLabels = this.remainingLabels.filter((l) => l !== this.enteredLabel);
                this.enteredLabel = '';
                this.calculateScore();
                if (this.remainingLabels.length === 0) {
                    this.endGame();
                } else {
                    this.proposeNewZone();
                }
            } else {
                this.errorCount++;
                this.appellationErrorCount++;
                this.calculateScore();
                if (this.appellationErrorCount >= 3) {
                    const paths = this.labelMap.get(sanitizedSearchLabel);
                    if (paths) {
                        paths.forEach((path) => {
                            path.removeAttribute('style');
                            this.renderer.setAttribute(path, 'fill', this.colorMap[3]);
                            path.style.cssText = `fill: ${this.colorMap[3]} !important; animation: none !important`;
                            path.setAttribute('opacity', '1');
                            path.style.opacity = '1';
                            path.classList.remove('blinking');
                            path.classList.add('validated');
                        });
                    } else {
                        console.error(`No paths found for sanitized label: ${sanitizedSearchLabel}`);
                    }
                    this.displayedAnswer = this.searchLabel;
                    this.displayAnswer = true;
                    const isLastZone = this.remainingLabels.length === 1;
                    this.remainingLabels = this.remainingLabels.filter((l) => l !== sanitizedSearchLabel);
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
            this.labelMap.forEach((paths) => {
                paths.forEach((path) => path.classList.remove('blinking'));
            });
            const nextLabel = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
            this.searchLabel =
                Array.from(this.rawToSanitizedLabelMap.entries()).find(([raw, sanitized]) => sanitized === nextLabel)?.[0] || nextLabel;
            const paths = this.labelMap.get(nextLabel);
            if (paths) {
                paths.forEach((path) => {
                    path.classList.add('blinking');
                    path.setAttribute('opacity', '1');
                    path.style.opacity = '1';
                });
            } else {
                console.error(`No paths found for sanitized label: ${nextLabel}`);
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