import {
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    SimpleChanges,
    ViewEncapsulation,
    ChangeDetectorRef,
    OnInit,
    OnDestroy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {MatIcon} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {GAME_CONFIG} from '../../utils/game-config';

@Component({
    selector: 'point-and-click',
    imports: [CommonModule, MatIcon, MatButtonModule, MatCardModule, MatListModule],
    templateUrl: './point-and-click.component.html',
    styleUrls: ['./point-and-click.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PointAndClickComponent implements OnInit, OnChanges, OnDestroy {
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
    elapsedTime: number = 0;
    showConfetti = false;
    confettiArray: { left: number, color: string, delay: number }[] = [];
    private timerInterval: number | null = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    score = 0;
    private labelMap = new Map<string, { labels: string[], paths: SVGPathElement[] }>();
    remainingLabels: string[] = [];
    searchLabel: string = '';
    errorCount = 0;
    allLabels: string[] = [];

    private audioContext: AudioContext | null = null;
    private popSoundBuffer: AudioBuffer | null = null;

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer,
        private el: ElementRef,
        private renderer: Renderer2,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.initializeAudio();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['svgPath'] && changes['svgPath'].currentValue) {
            this.loadSvg();
        }
    }

    ngOnDestroy() {
        this.stopTimer();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    private async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const response = await fetch('assets/sounds/pop.wav');
            if (!response.ok) throw new Error('Échec du chargement du fichier WAV');
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
            source.start(0);
        } else {
            console.warn('Son non joué: audioContext ou popSoundBuffer non initialisé');
        }
    }

    private loadSvg() {
        this.http.get(this.svgPath, { responseType: 'text' }).subscribe({
            next: (svg) => {
                console.log('SVG chargé:', svg.substring(0, 100));
                this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                console.log('SVG appliqué au DOM');
                setTimeout(() => {
                    this.setupListeners();
                    const svgWrapper = this.el.nativeElement.querySelector('.svg-wrapper svg');
                    if (!svgWrapper) {
                        console.error('SVG non rendu dans le DOM');
                    } else {
                        console.log('SVG rendu avec succès');
                    }
                }, 0);
            },
            error: (err) => {
                console.error(`Erreur lors du chargement du SVG: ${this.svgPath}`, err);
                this.svgContent = '';
            }
        });
    }

    private setupListeners() {
        const svgWrapper: HTMLElement = this.el.nativeElement.querySelector('.svg-wrapper');
        if (!svgWrapper) {
            console.error('SVG wrapper not found');
            return;
        }

        const allPaths = svgWrapper.querySelectorAll('path.clickable-region') as NodeListOf<SVGPathElement>;
        if (!allPaths.length) {
            console.error('No clickable regions found in SVG');
            return;
        }

        allPaths.forEach((path) => {
            const labelAttr = path.getAttribute('data-label');
            if (!labelAttr) {
                console.warn('Path sans data-label détecté', path);
                return;
            }
            const labels = labelAttr.split(',').map(l => l.trim());

            labels.forEach(label => {
                if (!this.labelMap.has(label)) {
                    this.labelMap.set(label, { labels, paths: [] });
                }
                const entry = this.labelMap.get(label)!;
                if (!entry.paths.includes(path)) {
                    entry.paths.push(path);
                }
            });
        });

        this.labelMap.forEach((entry, label) => {
            entry.paths.forEach(path => {
                this.renderer.listen(path, 'mouseenter', () => {
                    entry.paths.forEach(p => this.renderer.addClass(p, 'hovered'));
                    this.hoveredLabel = label;
                });

                this.renderer.listen(path, 'mouseleave', () => {
                    entry.paths.forEach(p => this.renderer.removeClass(p, 'hovered'));
                    this.hoveredLabel = null;
                });

                this.renderer.listen(path, 'click', () => {
                    if (this.gameStarted && !this.gamePaused) {
                        this.onZoneClick(label);
                    }
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
        this.score = 0;
        this.searchLabel = '';
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.allLabels = Array.from(this.labelMap.keys());
        this.searchLabel = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
        this.labelMap.forEach((entry) => {
            entry.paths.forEach(path => {
                this.renderer.addClass(path, 'clickable-region');
                this.renderer.removeClass(path, 'found');
                this.renderer.removeClass(path, 'partial');
                this.renderer.removeClass(path, 'error');
                this.renderer.setAttribute(path, 'fill', path.getAttribute('fill') || '#9E9E9E');
                this.renderer.setAttribute(path, 'opacity', '0.2');
            });
        });
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
        }
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
        this.score = 0;
        this.searchLabel = '';
        this.remainingLabels = [];
        this.stopTimer();
        this.labelMap.forEach((entry) => {
            entry.paths.forEach(path => {
                this.renderer.addClass(path, 'clickable-region');
                this.renderer.removeClass(path, 'found');
                this.renderer.removeClass(path, 'partial');
                this.renderer.removeClass(path, 'error');
                this.renderer.setAttribute(path, 'fill', path.getAttribute('fill') || '#9E9E9E');
                this.renderer.setAttribute(path, 'opacity', '1');
            });
        });
    }

    replayGame() {
        this.clearGame();
        this.startGame();
    }

    private onZoneClick(label: string) {
        if (this.gameStarted && !this.gamePaused) {
            if (label === this.searchLabel) {
                this.remainingLabels = this.remainingLabels.filter(l => l !== label);
                const entry = this.labelMap.get(label)!;
                const allLabelsFound = entry.labels.every(l => !this.remainingLabels.includes(l));
                entry.paths.forEach(path => {
                    if (allLabelsFound) {
                        this.renderer.addClass(path, 'found');
                        this.renderer.removeClass(path, 'partial');
                        this.renderer.removeClass(path, 'clickable-region');
                        this.renderer.setAttribute(path, 'fill', '#4CAF50');
                        this.renderer.setAttribute(path, 'opacity', '1');
                    } else {
                        this.renderer.addClass(path, 'partial');
                        this.renderer.removeClass(path, 'found');
                        this.renderer.setAttribute(path, 'fill', '#FF4500');
                        this.renderer.setAttribute(path, 'opacity', '0.6');
                    }
                    console.log('Classe appliquée au path:', path, 'Classe:', allLabelsFound ? 'found' : 'partial', 'Styles actuels:', path.getAttribute('style'));
                });
                this.calculateScore();
                if (this.remainingLabels.length === 0) {
                    this.endGame();
                } else {
                    this.searchLabel = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
                }
            } else {
                this.errorCount++;
                this.labelMap.get(label)?.paths.forEach(path => {
                    this.renderer.addClass(path, 'error');
                    this.renderer.setAttribute(path, 'fill', '#F44336');
                    this.renderer.setAttribute(path, 'opacity', '0.7');
                    setTimeout(() => {
                        this.renderer.removeClass(path, 'error');
                        this.renderer.setAttribute(path, 'fill', path.getAttribute('fill') || '#9E9E9E');
                        this.renderer.setAttribute(path, 'opacity', '0.2');
                    }, 500);
                });
                this.calculateScore();
            }
        }
    }

    private calculateScore() {
        const zonesFound = this.allLabels.length - this.remainingLabels.length;
        this.score = (zonesFound * GAME_CONFIG.POINTS_PER_ZONE) -
            (this.errorCount * GAME_CONFIG.ERROR_PENALTY) -
            (Math.floor(this.elapsedTime / 1000) * GAME_CONFIG.TIME_PENALTY);
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
            delay: Math.random() * 1.5
        }));

        this.showConfetti = true;

        setTimeout(() => {
            this.showConfetti = false;
            this.confettiArray = [];
        }, 3000);
    }
}