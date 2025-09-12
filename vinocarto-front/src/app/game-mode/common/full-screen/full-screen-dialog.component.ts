import {
    Component,
    Inject,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-full-screen-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
    templateUrl: './full-screen-dialog.component.html',
    styleUrls: ['./full-screen-dialog.component.scss']
})
export class FullScreenDialogComponent implements AfterViewInit, OnDestroy {
    @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;

    inputValue = '';
    overlayType: 'input' | 'label' = 'label';
    get labelText(): string {
        return typeof this.data?.getLabel === 'function' ? this.data.getLabel() : '';
    }
    svgHtml = '';

    private originalParent: Node | null = null;
    private originalNextSibling: ChildNode | null = null;
    private movedSvgElement: HTMLElement | null = null;

    constructor(
        public dialogRef: MatDialogRef<FullScreenDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            svgWrapper?: HTMLElement;
            getCurrentSvg?: () => string;
            svgContent?: string;
            overlayType?: string;
            getLabel?: () => string;
            submitFn?: (value: string) => void;
            onZoneClickCallback?: (label: string) => void;
        }
    ) {}

    ngAfterViewInit() {
        this.overlayType = this.data?.overlayType === 'input' ? 'input' : 'label';

        if (this.data?.svgWrapper instanceof HTMLElement) {
            this.attachSvgByMoving(this.data.svgWrapper);
        } else {
            this.renderHtmlFallback();
        }

        if ((this.overlayType === 'label' || this.overlayType === 'input')
            && typeof this.data?.onZoneClickCallback === 'function') {
            setTimeout(() => {
                const svgEl = this.svgHost.nativeElement.querySelector('svg');
                if (!svgEl) return;
                svgEl.querySelectorAll('path.clickable-region').forEach(path => {
                    path.addEventListener('click', () => {
                        const label = path.getAttribute('data-label') || '';
                        this.data?.onZoneClickCallback?.(label);
                    });
                });
            }, 0);
        }
    }

    private attachSvgByMoving(svgWrapper: HTMLElement) {
        this.originalParent = svgWrapper.parentNode;
        this.originalNextSibling = svgWrapper.nextSibling;
        this.svgHost.nativeElement.innerHTML = '';
        svgWrapper.style.width = '100%';
        svgWrapper.style.height = '100%';
        svgWrapper.style.maxWidth = 'none';
        svgWrapper.style.maxHeight = 'none';
        svgWrapper.style.display = 'block';
        this.svgHost.nativeElement.appendChild(svgWrapper);
        this.movedSvgElement = svgWrapper;
    }

    private renderHtmlFallback() {
        const host = this.svgHost.nativeElement;
        host.innerHTML = '';
        let html = '';
        if (typeof this.data?.getCurrentSvg === 'function') {
            html = this.data.getCurrentSvg() || '';
        } else if (this.data?.svgContent) {
            html = this.data.svgContent;
        }
        host.innerHTML = html;
        const svg = host.querySelector('svg') as SVGSVGElement | null;
        if (svg) {
            svg.removeAttribute('width');
            svg.removeAttribute('height');
            svg.style.width = '100%';
            svg.style.height = '100%';
        }
    }

    onSubmit() {
        if (!this.inputValue || !this.inputValue.trim()) return;

        const val = this.inputValue.trim();

        if (typeof this.data?.submitFn === 'function') {
            this.data.submitFn(val);
        }

        this.inputValue = '';
         if (!this.movedSvgElement && typeof this.data?.getCurrentSvg === 'function') {
            this.svgHost.nativeElement.innerHTML = this.data.getCurrentSvg();
            const svg = this.svgHost.nativeElement.querySelector('svg') as SVGSVGElement | null;
            if (svg) {
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.width = '100%';
                svg.style.height = '100%';
            }
        }
    }

    close() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        if (this.movedSvgElement && this.originalParent) {
            try {
                if (this.originalNextSibling && this.originalNextSibling.parentNode === this.originalParent) {
                    this.originalParent.insertBefore(this.movedSvgElement, this.originalNextSibling);
                } else {
                    this.originalParent.appendChild(this.movedSvgElement);
                }
                this.movedSvgElement.style.removeProperty('width');
                this.movedSvgElement.style.removeProperty('height');
                this.movedSvgElement.style.removeProperty('max-width');
                this.movedSvgElement.style.removeProperty('max-height');
                this.movedSvgElement.style.removeProperty('display');
            } catch (e) {
                console.warn('Impossible de restaurer le SVG à son parent d’origine', e);
            }
        }
    }
}