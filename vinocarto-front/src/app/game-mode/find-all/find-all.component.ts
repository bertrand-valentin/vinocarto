import {
    AfterViewChecked,
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    SimpleChanges, ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {MatIcon} from "@angular/material/icon";
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from "@angular/forms";
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {StringUtilsService} from "../../utils/string-utils.service";

export interface Result {
    appellation: string;
    label: string;
    timestamp: number;
    isHidden: boolean;
    isCorrect: boolean;
}

@Component({
    selector: 'find-all',
    imports: [CommonModule, MatIcon, MatButtonModule, MatListModule, MatInputModule, FormsModule, MatTableModule, MatSortModule],
    templateUrl: './find-all.component.html',
    styleUrls: ['./find-all.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FindAllComponent implements OnChanges, AfterViewChecked {

    constructor(private http: HttpClient, private sanitizer: DomSanitizer, private el: ElementRef, private renderer: Renderer2, private stringUtils: StringUtilsService) {
    }

    @Input() svgPath!: string;
    svgContent: SafeHtml = '';
    gameStarted = false;
    gamePaused = false;
    gameEnded = false;
    gameWon = false;
    showConfetti = false;
    elapsedTime: number = 0;
    private timerInterval: any = null;
    private startTimestamp = 0;
    private pauseOffset = 0;
    private labelMap = new Map<string, Element[]>();
    remainingLabels: string[] = [];
    allLabels: string[] = [];
    results = new MatTableDataSource<Result>();
    enteredLabel: string = '';
    errorCount = 0;
    displayedColumns: string[] = ['appellation', 'timestamp'];
    confettiArray: { left: number, color: string, delay: number }[] = [];


    @ViewChild(MatSort, {static: false}) sort!: MatSort;

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
        this.http.get(this.svgPath, {responseType: 'text'}).subscribe({
            next: (svg) => {
                this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
                setTimeout(() => this.setupSvg(), 0);
            },
            error: (err) => {
                console.error(`Erreur lors du chargement du SVG: ${this.svgPath}`, err);
                this.svgContent = '';
            }
        });
    }

    private setupSvg() {
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
    }

    startGame() {
        this.gameStarted = true;
        this.gamePaused = false;
        this.startTimestamp = Date.now();
        this.pauseOffset = 0;
        this.errorCount = 0;
        this.startTimerLoop();
        this.remainingLabels = Array.from(this.labelMap.keys());
        this.allLabels = Array.from(this.labelMap.keys());
        const resultList: Result[] = this.remainingLabels.map(label => ({
            appellation: label,
            label: this.stringUtils.sanitize(label),
            timestamp: 0,
            isHidden: true,
            isCorrect: false
        }));
        resultList.sort((a, b) => a.appellation.localeCompare(b.appellation));
        this.results.data = resultList;
        this.remainingLabels = this.remainingLabels.map(label => this.stringUtils.sanitize(label));
        this.results.sort = this.sort;
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
        if (this.remainingLabels.length === 0) {
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
        this.results.data = [];
        this.remainingLabels = [];
        this.labelMap.forEach(label => label.forEach(path => path.setAttribute('opacity', '1')));
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
            let index = this.results.data.findIndex(r => r.label === this.enteredLabel);
            if (this.remainingLabels.includes(this.enteredLabel)) {
                this.results.data[index].timestamp = this.elapsedTime;
                this.results.data[index].isHidden = false;
                this.results.data[index].isCorrect = true;
                this.results.data = [...this.results.data];
                let mapEntyLabel = this.allLabels.find(l => this.stringUtils.sanitize(l) === this.enteredLabel);
                if (mapEntyLabel) {
                    this.labelMap.get(mapEntyLabel)?.forEach(path => path.setAttribute('opacity', '0.2'));
                }
                this.remainingLabels = this.remainingLabels.filter(l => l !== this.enteredLabel);
                this.enteredLabel = '';
                if (this.remainingLabels.length === 0) {
                    this.gameEnded = true;
                    this.endGame();
                }
            } else {
                this.enteredLabel = '';
                if (index <= 0) {
                    this.errorCount += 1;
                }
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
