import {
    AfterViewChecked,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
    ChangeDetectorRef,
    Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { StringUtilsService } from '../../utils/string-utils.service';
import { GAME_CONFIG } from '../../utils/game-config';
import { MatCardModule } from '@angular/material/card';
import {MatTooltip} from "@angular/material/tooltip";

export interface Result {
    appellation: string;
    label: string;
    timestamp: number;
    isCorrect: boolean;
}

@Component({
    selector: 'find-all',
    imports: [
        CommonModule,
        MatIcon,
        MatButtonModule,
        MatListModule,
        MatInputModule,
        FormsModule,
        MatTableModule,
        MatSortModule,
        MatCardModule,
        MatTooltip,
    ],
    templateUrl: './find-all.component.html',
    styleUrls: ['./find-all.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FindAllComponent implements OnChanges, AfterViewChecked {
    @Input() svgPath!: string;
    svgContent: SafeHtml = '';
    gameStarted = false;
    gamePaused = false;
    gameEnded = false;
    gameWon = false;
    showConfetti = false;
    elapsedTime: number = 0;
    score = 0;
    enteredLabel: string = '';
    errorCount = 0;
    feedbackMessage: string = '';
    private timerInterval: any = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    private labelMap = new Map<string, SVGPathElement[]>();
    private rawToSanitizedLabelMap = new Map<string, string>();
    remainingLabels: string[] = [];
    allLabels: string[] = [];
    results = new MatTableDataSource<Result>();
    displayedColumns: string[] = ['appellation', 'timestamp'];
    confettiArray: { left: number; color: string; delay: number }[] = [];
    pointsPerZone: number = GAME_CONFIG.POINTS_PER_ZONE;
    errorPenalty: number = GAME_CONFIG.ERROR_PENALTY;
    timePenalty: number = GAME_CONFIG.TIME_PENALTY;

    @ViewChild(MatSort, { static: false }) sort!: MatSort;

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

    ngAfterViewChecked() {
        if (this.sort && !this.results.sort) {
            this.results.sort = this.sort;
        }
    }

    private loadSvg() {
        this.http.get(this.svgPath, { responseType: 'text' }).subscribe({
            next: (svg) => {
                this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                setTimeout(() => this.setupSvg(), 200);
            },
            error: (err) => {
                this.svgContent = '';
            },
        });
    }

    private setupSvg() {
        const svgWrapper: HTMLElement = this.el.nativeElement.querySelector('.svg-wrapper');
        if (!svgWrapper) {
            return;
        }

        const allPaths = svgWrapper.querySelectorAll('path.clickable-region');
        if (!allPaths.length) {
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
    }

    startGame() {
        this.gameStarted = true;
        this.gamePaused = false;
        this.gameEnded = false;
        this.gameWon = false;
        this.elapsedTime = 0;
        this.score = 0;
        this.errorCount = 0;
        this.feedbackMessage = '';
        this.startTimestamp = Date.now();
        this.pauseOffset = 0;
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.allLabels = Array.from(this.labelMap.keys());
        const resultList: Result[] = this.allLabels.map((label) => ({
            appellation: Array.from(this.rawToSanitizedLabelMap.entries()).find(
                ([raw, sanitized]) => sanitized === label
            )?.[0] || label,
            label: this.stringUtils.sanitize(label),
            timestamp: 0,
            isCorrect: false,
        }));
        resultList.sort((a, b) => a.appellation.localeCompare(b.appellation));
        this.results.data = resultList;
        this.remainingLabels = this.remainingLabels.map((label) => this.stringUtils.sanitize(label));
        this.results.sort = this.sort;
        this.labelMap.forEach((paths) => {
            paths.forEach((path) => {
                this.renderer.setAttribute(path, 'fill', '#9E9E9E');
                path.setAttribute('opacity', '0.2');
                path.classList.remove('blinking');
            });
        });
        this.cdr.detectChanges();
    }

    pauseGame() {
        this.gamePaused = true;
        clearInterval(this.timerInterval);
        this.pauseOffset += Date.now() - this.startTimestamp;
    }

    resumeGame() {
        this.gamePaused = false;
        this.startTimestamp = Date.now();
        this.startTimerLoop();
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.pauseOffset += Date.now() - this.startTimestamp;
        this.gameEnded = true;
        if (this.remainingLabels.length === 0) {
            this.gameWon = true;
            this.calculateScore();
            this.triggerConfetti();
            this.resetSvg();
        }
        this.results.data = this.results.data.map((result) => ({
            ...result,
        }));
        this.cdr.detectChanges();
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
        this.score = 0;
        this.errorCount = 0;
        this.feedbackMessage = '';
        this.startTimestamp = 0;
        this.pauseOffset = 0;
        this.results.data = [];
        this.remainingLabels = [];
        this.resetSvg();
        clearInterval(this.timerInterval);
        this.cdr.detectChanges();
    }

    private startTimerLoop() {
        clearInterval(this.timerInterval);
        this.startTimestamp = Date.now();
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            this.elapsedTime = now - this.startTimestamp + this.pauseOffset;
            this.calculateScore();
            this.cdr.detectChanges();
        }, 1000);
    }

    submitValue(enteredLabel: string) {
        this.enteredLabel = this.stringUtils.sanitize(enteredLabel);
        this.feedbackMessage = '';
        if (this.gameStarted && !this.gamePaused) {
            const index = this.results.data.findIndex((r) => r.label === this.enteredLabel);
            if (this.remainingLabels.includes(this.enteredLabel)) {
                const result = this.results.data[index];
                result.timestamp = this.elapsedTime;
                result.isCorrect = true;
                this.results.data = [...this.results.data];
                const rawLabel = Array.from(this.rawToSanitizedLabelMap.entries()).find(
                    ([raw, sanitized]) => sanitized === this.enteredLabel
                )?.[0];
                if (rawLabel) {
                    const paths = this.labelMap.get(this.enteredLabel);
                    if (paths) {
                        paths.forEach((path) => {
                            path.removeAttribute('style');
                            this.renderer.setAttribute(path, 'fill', '#4CAF50');
                            path.style.cssText = `fill: #4CAF50 !important; opacity: 1 !important; animation: none !important`;
                            path.setAttribute('opacity', '1');
                            path.style.opacity = '1';
                            path.classList.remove('blinking');
                            path.classList.add('validated');
                        });
                    }
                }
                this.feedbackMessage = 'Correct !';
                setTimeout(() => (this.feedbackMessage = ''), 2000);
                this.remainingLabels = this.remainingLabels.filter((l) => l !== this.enteredLabel);
                this.calculateScore();
                this.enteredLabel = '';
                if (this.remainingLabels.length === 0) {
                    this.endGame();
                }
            } else {
                this.errorCount++;
                this.feedbackMessage = 'Appellation inconnue !';
                setTimeout(() => (this.feedbackMessage = ''), 2000);
                this.enteredLabel = '';
                this.calculateScore();
                this.cdr.detectChanges();
            }
        }
    }

    showHint() {
        if (this.remainingLabels.length > 0) {
            this.labelMap.forEach((paths, sanitizedLabel) => {
                if (this.remainingLabels.includes(sanitizedLabel)) {
                    paths.forEach((path) => {
                        path.removeAttribute('style');
                        this.renderer.setAttribute(path, 'fill', '#EF6C00');
                        path.style.cssText = `fill: #EF6C00 !important; opacity: 1 !important`;
                        path.setAttribute('opacity', '1');
                        path.classList.add('blinking');
                    });
                }
            });
            setTimeout(() => {
                this.labelMap.forEach((paths, sanitizedLabel) => {
                    if (this.remainingLabels.includes(sanitizedLabel)) {
                        paths.forEach((path) => {
                            path.removeAttribute('style');
                            this.renderer.setAttribute(path, 'fill', '#9E9E9E');
                            path.style.cssText = `fill: #9E9E9E !important; opacity: 0.2 !important`;
                            path.setAttribute('opacity', '0.2');
                            path.classList.remove('blinking');
                        });
                    }
                });
                this.cdr.detectChanges();
            }, 3000);
        }
    }

    private calculateScore() {
        const zonesFound = this.allLabels.length - this.remainingLabels.length;
        this.score =
            zonesFound * this.pointsPerZone -
            this.errorCount * this.errorPenalty -
            Math.floor(this.elapsedTime / 1000) * this.timePenalty;
    }

    triggerConfetti() {
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
}