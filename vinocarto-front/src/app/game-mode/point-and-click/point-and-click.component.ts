import {
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {MatIcon} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';

@Component({
    selector: 'point-and-click',
    imports: [CommonModule, MatIcon, MatButtonModule, MatCardModule, MatListModule],
    templateUrl: './point-and-click.component.html',
    styleUrls: ['./point-and-click.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PointAndClickComponent implements OnChanges {

    constructor(private http: HttpClient, private sanitizer: DomSanitizer, private el: ElementRef, private renderer: Renderer2) {
    }

    @Input() svgPath!: string;
    svgContent: SafeHtml = '';
    hoveredLabel: string | null = null;
    gameStarted = false;
    gamePaused = false;
    gameEnded = false;
    gameWon = false;
    elapsedTime: number = 0;
    showConfetti = false;
    confettiArray: { left: number, color: string, delay: number }[] = [];
    private timerInterval: any = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    private labelMap = new Map<string, Element[]>();
    private remainingLabels: string[] = [];
    searchLabel: string = '';
    errorCount = 0;


    ngOnChanges(changes: SimpleChanges) {
        if (changes['svgPath'] && changes['svgPath'].currentValue) {
            console.log(`Chargement du SVG: ${this.svgPath}`);
            this.loadSvg();
        }
    }

    private loadSvg() {
        this.http.get(this.svgPath, {responseType: 'text'}).subscribe({
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
        if (!svgWrapper) return;

        const allPaths = svgWrapper.querySelectorAll('path.clickable-region');

        allPaths.forEach((path) => {
            const label = path.getAttribute('data-label');
            if (!label) return;

            if (!this.labelMap.has(label)) {
                this.labelMap.set(label, []);
            }
            this.labelMap.get(label)?.push(path);
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
                    const label = path.getAttribute('data-label');
                    if (label) {
                        this.onZoneClick(label);
                    }
                });
            });
        });
    }

    startGame() {
        this.gameStarted = true;
        this.gamePaused = false;
        this.startTimestamp = Date.now();
        this.pauseOffset = 0;
        this.errorCount = 0;
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.searchLabel = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
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
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.gameEnded = true;
        if(this.remainingLabels.length === 0) {
            console.log('game won');
            this.gameWon = true;
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
        clearInterval(this.timerInterval);
        this.labelMap.forEach(label => label.forEach(path => path.setAttribute('opacity', '1')));
    }

    private startTimerLoop() {
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            this.elapsedTime = now - this.startTimestamp + this.pauseOffset;
        }, 1000);
    }

    private onZoneClick(label: string) {
        if(this.gameStarted && !this.gamePaused) {
            console.log(label, this.searchLabel);
            if(label === this.searchLabel) {
                this.remainingLabels = this.remainingLabels.filter(l => l !== label);
                this.labelMap.get(label)?.forEach(path => path.setAttribute('opacity', '0.2'));
                if (this.remainingLabels.length === 0) {
                    this.endGame();
                } else {
                    this.searchLabel = this.remainingLabels[Math.floor(Math.random() * this.remainingLabels.length)];
                }
            }
            else {
                this.errorCount += 1;
            }
        }
    }

    triggerConfetti() {
        this.confettiArray = Array.from({length: 30}, () => ({
            left: Math.random() * 100,
            color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`,
            delay: Math.random() * 1.5,
        }));

        this.showConfetti = true;

        setTimeout(() => {
            this.showConfetti = false;
        }, 3000);
    }
}
