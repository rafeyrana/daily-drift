export class Logo {
  private element: SVGSVGElement;

  constructor() {
    this.element = this.createLogoSVG();
  }

  getElement(): SVGSVGElement {
    return this.element;
  }

  setGlitchActive(active: boolean): void {
    if (active) {
      this.element.classList.add('glitch');
    } else {
      this.element.classList.remove('glitch');
    }
  }

  private createLogoSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 120');
    svg.setAttribute('width', '400');
    svg.setAttribute('height', '120');
    svg.classList.add('pixel-logo');

    // Add pixel-logo specific styles
    const style = document.createElement('style');
    style.textContent = `
      .pixel-logo {
        filter: drop-shadow(0 0 10px var(--accent));
        transition: var(--transition);
      }
      
      .pixel-logo:hover {
        filter: drop-shadow(0 0 20px var(--accent)) drop-shadow(0 0 40px var(--pixel));
      }
      
      .pixel-logo.glitch {
        animation: glitch 0.3s ease-in-out infinite;
      }
      
      .pixel-rect {
        fill: var(--accent);
        transition: fill 0.1s ease;
      }
      
      .pixel-logo:hover .pixel-rect:nth-child(odd) {
        fill: var(--pixel);
      }
    `;
    svg.appendChild(style);

    // DAILY DRIFT in pixel blocks
    const letterData = this.getPixelLetterData();
    
    let xOffset = 0;
    const letters = ['D', 'A', 'I', 'L', 'Y', ' ', 'D', 'R', 'I', 'F', 'T'];
    
    letters.forEach(letter => {
      const pixels = letterData[letter] || [];
      pixels.forEach(([x, y]) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (xOffset + x * 4).toString());
        rect.setAttribute('y', (y * 4).toString());
        rect.setAttribute('width', '4');
        rect.setAttribute('height', '4');
        rect.classList.add('pixel-rect');
        svg.appendChild(rect);
      });
      xOffset += letter === ' ' ? 16 : 28;
    });

    return svg;
  }

  private getPixelLetterData(): Record<string, [number, number][]> {
    return {
      'D': [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[4,1],
        [0,2],[4,2],
        [0,3],[4,3],
        [0,4],[4,4],
        [0,5],[4,5],
        [0,6],[4,6],
        [0,7],[1,7],[2,7],[3,7]
      ],
      'A': [
        [1,0],[2,0],
        [0,1],[3,1],
        [0,2],[3,2],
        [0,3],[1,3],[2,3],[3,3],
        [0,4],[3,4],
        [0,5],[3,5],
        [0,6],[3,6],
        [0,7],[3,7]
      ],
      'I': [
        [0,0],[1,0],[2,0],[3,0],[4,0],
        [2,1],
        [2,2],
        [2,3],
        [2,4],
        [2,5],
        [2,6],
        [0,7],[1,7],[2,7],[3,7],[4,7]
      ],
      'L': [
        [0,0],
        [0,1],
        [0,2],
        [0,3],
        [0,4],
        [0,5],
        [0,6],
        [0,7],[1,7],[2,7],[3,7],[4,7]
      ],
      'Y': [
        [0,0],[4,0],
        [0,1],[4,1],
        [1,2],[3,2],
        [2,3],
        [2,4],
        [2,5],
        [2,6],
        [2,7]
      ],
      'R': [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[4,1],
        [0,2],[4,2],
        [0,3],[1,3],[2,3],[3,3],
        [0,4],[2,4],
        [0,5],[3,5],
        [0,6],[4,6],
        [0,7],[4,7]
      ],
      'F': [
        [0,0],[1,0],[2,0],[3,0],[4,0],
        [0,1],
        [0,2],
        [0,3],[1,3],[2,3],[3,3],
        [0,4],
        [0,5],
        [0,6],
        [0,7]
      ],
      'T': [
        [0,0],[1,0],[2,0],[3,0],[4,0],
        [2,1],
        [2,2],
        [2,3],
        [2,4],
        [2,5],
        [2,6],
        [2,7]
      ]
    };
  }
}