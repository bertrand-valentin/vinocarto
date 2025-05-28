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
import {MatInput, MatSuffix} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {StringUtilsService} from "../../utils/string-utils.service";

@Component({
    selector: 'forced-search',
    imports: [CommonModule, MatIcon, MatButtonModule, MatCardModule, MatListModule, MatInput, MatSuffix, ReactiveFormsModule, MatFormFieldModule, FormsModule],
    templateUrl: './forced-search.component.html',
    styleUrls: ['./forced-search.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ForcedSearchComponent implements OnChanges {

    constructor(private http: HttpClient, private sanitizer: DomSanitizer, private el: ElementRef, private renderer: Renderer2, private stringUtils : StringUtilsService) {
    }

    @Input() svgPath!: string;
    svgContent: SafeHtml = '';
    hoveredLabel: string | null = null;
    gameStarted = false;
    gamePaused = false;
    gameEnded = false;
    gameWon = false;
    displayAnswer= false;
    displayedAnswer = '';
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
    appellationErrorCount = 0;
    enteredLabel: string = '';
    allLabels: string[] = [];
    private colorMap: { [key: number]: string } = {
        0: '#00C853',
        1: '#FFB300',
        2: '#EF6C00',
        3: '#D50000',
    };


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
        this.remainingLabels = this.remainingLabels.map(label => this.stringUtils.sanitize(label));
        this.allLabels = Array.from(this.labelMap.keys());
        this.labelMap.forEach(label =>
            label.forEach(path => {
                path.setAttribute('fill', '#9E9E9E');
                path.setAttribute('opacity', '0.2');
                (path as HTMLElement).style.fill = '#9E9E9E';
            })
        );
        this.proposeNewZone();
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
        this.labelMap.forEach(label => label.forEach(path => {path.setAttribute('opacity', '1');
                                                                                 path.classList.remove('blinking');}));
    }

    private startTimerLoop() {
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            this.elapsedTime = now - this.startTimestamp + this.pauseOffset;
        }, 1000);
    }

    submitValue(enteredLabel: string) {
        this.enteredLabel = this.stringUtils.sanitize(enteredLabel);
        if (this.gameStarted && !this.gamePaused) {
            if (this.stringUtils.sanitize(this.searchLabel) === this.enteredLabel) {
                let mapEntyLabel = this.allLabels.find(l => this.stringUtils.sanitize(l) === this.enteredLabel);
                if (mapEntyLabel) {
                    this.labelMap.get(mapEntyLabel)?.forEach(path=> {
                        path.setAttribute('fill', this.colorMap[this.appellationErrorCount]);
                        (path as HTMLElement).style.fill = this.colorMap[this.appellationErrorCount];
                        path.setAttribute('opacity', '0,2');
                        path.classList.remove('blinking')
                    });
                    this.appellationErrorCount = 0;
                }
                this.remainingLabels = this.remainingLabels.filter(l => l !== this.enteredLabel);
                this.enteredLabel = '';
                this.proposeNewZone();
                if (this.remainingLabels.length === 0) {
                    this.gameEnded = true;
                    this.endGame();
                }
            } else {
                this.errorCount += 1;
                this.appellationErrorCount += 1;
                if(this.appellationErrorCount >= 3) {
                    this.labelMap.get(this.searchLabel)?.forEach(path => {
                        path.classList.remove('blinking');
                        path.setAttribute('fill', this.colorMap[3]);
                        (path as HTMLElement).style.fill = this.colorMap[3];
                        path.setAttribute('opacity', '0,2');
                    });
                    this.displayedAnswer = this.searchLabel;
                    this.displayAnswer = true;
                    this.waitTwoSeconds().then(r => this.displayAnswer = false);
                    this.remainingLabels = this.remainingLabels.filter(l => l !== this.stringUtils.sanitize(this.searchLabel));
                    if (this.remainingLabels.length === 0) {
                        this.gameEnded = true;
                        this.endGame();
                    }
                    this.proposeNewZone();
                    this.appellationErrorCount = 0;
                    this.enteredLabel = '';
                }
                this.enteredLabel = '';
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

    private proposeNewZone() {
        this.searchLabel = this.allLabels.filter(l => this.remainingLabels.includes(this.stringUtils.sanitize(l)))[Math.floor(Math.random() * this.remainingLabels.length)];
        this.labelMap.get(this.searchLabel)?.forEach(path =>  {path.classList.add('blinking');
                                                                        path.setAttribute('opacity', '1');});
    }

    private waitTwoSeconds(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 2000));
    }
}
