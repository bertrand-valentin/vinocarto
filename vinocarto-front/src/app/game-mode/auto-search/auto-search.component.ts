import {
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    SimpleChanges,
    ViewEncapsulation,
    OnDestroy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {MatIcon} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {MatInput, MatSuffix} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {StringUtilsService} from "../../utils/string-utils.service";
import { GAME_CONFIG } from '../../utils/game-config';

@Component({
    selector: 'auto-search',
    imports: [CommonModule, MatIcon, MatButtonModule, MatCardModule, MatListModule, MatInput, MatSuffix, ReactiveFormsModule, MatFormFieldModule, FormsModule],
    templateUrl: './auto-search.component.html',
    styleUrls: ['./auto-search.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AutoSearchComponent implements OnChanges, OnDestroy {
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
    elapsedTime = 0;
    showConfetti = false;
    confettiArray: { left: number, color: string, delay: number }[] = [];
    private timerInterval: number | null = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    score = 0;
    private labelMap = new Map<string, Element[]>();
    remainingLabels: string[] = [];
    searchLabel = '';
    errorCount = 0;
    enteredLabel = '';
    allLabels: string[] = [];
    isInputDisabled = true;
    isHintActive = false;

    private audioContext: AudioContext | null = null;
    private popSoundBuffer: AudioBuffer | null = null;

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer,
        private el: ElementRef,
        private renderer: Renderer2,
        private stringUtils: StringUtilsService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['svgPath'] && changes['svgPath'].currentValue) {
            this.loadSvg();
        }
    }

    ngOnDestroy() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
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
                this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                setTimeout(() => this.setupListeners(), 0);
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

        const allPaths = svgWrapper.querySelectorAll('path.clickable-region');
        if (!allPaths.length) {
            console.error('No clickable regions found in SVG');
            return;
        }

        allPaths.forEach((path) => {
            const label = path.getAttribute('data-label');
            if (!label) return;

            const sanitizedLabel = this.stringUtils.sanitize(label);
            if (!this.labelMap.has(sanitizedLabel)) {
                this.labelMap.set(sanitizedLabel, []);
            }
            this.labelMap.get(sanitizedLabel)?.push(path);
        });

        this.labelMap.forEach((paths, label) => {
            paths.forEach(path => {
                this.renderer.listen(path, 'mouseenter', () => {
                    paths.forEach(p => this.renderer.setStyle(p, 'opacity', '0.5'));
                    this.hoveredLabel = label;
                });

                this.renderer.listen(path, 'mouseleave', () => {
                    paths.forEach(p => this.renderer.removeStyle(p, 'opacity'));
                    this.hoveredLabel = null;
                });

                this.renderer.listen(path, 'click', () => {
                    if (this.gameStarted && !this.gamePaused) {
                        this.onLabelClick(label);
                    }
                });
            });
        });
    }

    private onLabelClick(label: string) {
        const sanitizedLabel = this.stringUtils.sanitize(label);
        if (this.remainingLabels.includes(sanitizedLabel)) {
            if (this.searchLabel && this.remainingLabels.includes(this.searchLabel)) {
                this.labelMap.get(this.searchLabel)?.forEach(path => {
                    path.setAttribute('fill', '#9E9E9E');
                    (path as HTMLElement).style.fill = '#9E9E9E';
                    path.setAttribute('opacity', '0.2');
                    path.classList.remove('blinking');
                });
            }
            this.searchLabel = sanitizedLabel;
            this.isInputDisabled = false;
            this.labelMap.get(sanitizedLabel)?.forEach(path => {
                path.setAttribute('fill', '#4CAF50');
                (path as HTMLElement).style.fill = '#4CAF50';
                path.setAttribute('opacity', '1');
                path.classList.add('blinking');
            });
        }
    }

    startGame() {
        this.gameStarted = true;
        this.gamePaused = false;
        this.gameEnded = false;
        this.gameWon = false;
        this.startTimestamp = Date.now();
        this.pauseOffset = 0;
        this.errorCount = 0;
        this.score = 0;
        this.enteredLabel = '';
        this.searchLabel = '';
        this.isInputDisabled = true;
        this.isHintActive = false;
        this.initializeAudio();
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.allLabels = Array.from(this.labelMap.keys());
        this.labelMap.forEach((paths) => {
            paths.forEach(path => {
                path.setAttribute('fill', '#9E9E9E');
                (path as HTMLElement).style.fill = '#9E9E9E';
                path.setAttribute('opacity', '0.2');
            });
        });
    }

    pauseGame() {
        this.gamePaused = true;
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.pauseOffset += Date.now() - this.startTimestamp;
    }

    resumeGame() {
        this.gamePaused = false;
        this.startTimestamp = Date.now();
        this.startTimerLoop();
    }

    endGame() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.pauseOffset += Date.now() - this.startTimestamp;
        this.gameEnded = true;
        this.isInputDisabled = true;
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
        this.enteredLabel = '';
        this.searchLabel = '';
        this.isInputDisabled = true;
        this.isHintActive = false;
        this.remainingLabels = [];
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.labelMap.forEach((paths) => {
            paths.forEach(path => {
                path.setAttribute('opacity', '1');
                path.classList.remove('blinking');
                path.classList.add('clickable-region');
                path.setAttribute('fill', '#9E9E9E');
                (path as HTMLElement).style.fill = '#9E9E9E';
            });
        });
    }

    replayGame() {
        this.clearGame();
        this.startGame();
    }

    submitValue(enteredLabel: string) {
        this.enteredLabel = this.stringUtils.sanitize(enteredLabel);
        if (this.gameStarted && !this.gamePaused) {
            if (this.enteredLabel === this.searchLabel) {
                this.remainingLabels = this.remainingLabels.filter(l => l !== this.enteredLabel);
                this.labelMap.get(this.enteredLabel)?.forEach(path => {
                    path.setAttribute('fill', '#4CAF50');
                    (path as HTMLElement).style.fill = '#4CAF50';
                    path.setAttribute('opacity', '1');
                    path.classList.remove('blinking');
                    path.classList.remove('clickable-region');
                });
                this.calculateScore();
                this.enteredLabel = '';
                this.searchLabel = '';
                this.isInputDisabled = true;
                if (this.remainingLabels.length === 0) {
                    this.endGame();
                }
            } else {
                this.errorCount += 1;
                this.calculateScore();
            }
        }
    }

    showHint() {
        if (this.isHintActive || !this.gameStarted || this.gamePaused || this.gameEnded) return;

        this.isHintActive = true;
        this.remainingLabels.forEach(label => {
            this.labelMap.get(label)?.forEach(path => {
                path.setAttribute('fill', '#FFA500');
                (path as HTMLElement).style.fill = '#FFA500';
                path.classList.add('blinking');
            });
        });

        setTimeout(() => {
            this.remainingLabels.forEach(label => {
                this.labelMap.get(label)?.forEach(path => {
                    path.classList.remove('blinking');
                    path.setAttribute('fill', '#9E9E9E');
                    (path as HTMLElement).style.fill = '#9E9E9E';
                });
            });
            this.isHintActive = false;
        }, 3000);
    }

    private calculateScore() {
        const zonesFound = this.allLabels.length - this.remainingLabels.length;
        this.score = (zonesFound * this.pointsPerZone) - (this.errorCount * this.errorPenalty) -
            (Math.floor(this.elapsedTime / 1000) * this.timePenalty);
    }

    private startTimerLoop() {
        this.timerInterval = window.setInterval(() => {
            const now = Date.now();
            this.elapsedTime = now - this.startTimestamp + this.pauseOffset;
            this.calculateScore();
        }, 1000);
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