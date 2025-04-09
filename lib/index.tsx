import * as isEqual from 'lodash.isequal';
import * as qrGenerator from 'qrcode-generator';
import * as React from 'react';

type EyeColor = string | InnerOuterEyeColor;
type InnerOuterEyeColor = {
    inner: string;
    outer: string;
}

type CornerRadii = number | [number, number, number, number] | InnerOuterRadii;
type InnerOuterRadii = {
    inner: number | [number, number, number, number];
    outer: number | [number, number, number, number];
}

export interface IProps {
    value?: string;
    ecLevel?: 'L' | 'M' | 'Q' | 'H';
    enableCORS?: boolean;
    size?: number;
    quietZone?: number;
    bgColor?: string;
    fgColor?: string;
    logoImage?: string;
    logoWidth?: number;
    logoHeight?: number;
    logoOpacity?: number;
    removeQrCodeBehindLogo?: boolean;
    eyeRadius?: CornerRadii | [CornerRadii, CornerRadii, CornerRadii];
    eyeColor?: EyeColor | [EyeColor, EyeColor, EyeColor];
    qrStyle?: 'squares' | 'dots';
    style?: object;
    id?: string;
    authenticated?: boolean;
}


interface ICoordinates {
    row: number;
    col: number;
}

let rgbKey = null;
export class QRCode extends React.Component<IProps, {}> {
    
    private canvas: React.RefObject<HTMLCanvasElement>;

    public static defaultProps: IProps = {
        value: 'https://reactjs.org/',
        ecLevel: 'M',
        enableCORS: false,
        size: 150,
        quietZone: 10,
        bgColor: '#FFFFFF',
        fgColor: '#000000',
        logoOpacity: 1,
        removeQrCodeBehindLogo: false,
        qrStyle: 'squares',
        eyeRadius: [0, 0, 0],
        authenticated: false,
    };

    private static utf16to8(str: string): string {
        let out: string = '', i: number, c: number;
        const len: number = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                out += str.charAt(i);
            } else if (c > 0x07FF) {
                out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            } else {
                out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            }
        }
        return out;
    }

    /**
     * Draw a rounded square in the canvas
     */
    private drawRoundedSquare(
        lineWidth: number,
        x: number,
        y: number,
        size: number,
        color: string,
        radii: number | number[],
        fill: boolean,
        ctx: CanvasRenderingContext2D) {

        ctx.lineWidth = lineWidth;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Adjust coordinates so that the outside of the stroke is aligned to the edges
        y += lineWidth / 2;
        x += lineWidth / 2;
        size -= lineWidth;

        if (!Array.isArray(radii)) {
            radii = [radii, radii, radii, radii];
        }

        // Radius should not be greater than half the size or less than zero
        radii = radii.map((r) => {
            r = Math.min(r, size / 2);
            return (r < 0) ? 0 : r;
        });

        const rTopLeft = radii[0] || 0;
        const rTopRight = radii[1] || 0;
        const rBottomRight = radii[2] || 0;
        const rBottomLeft = radii[3] || 0;

        ctx.beginPath();

        ctx.moveTo(x + rTopLeft, y);

        ctx.lineTo(x + size - rTopRight, y);
        if (rTopRight) ctx.quadraticCurveTo(x + size, y, x + size, y + rTopRight);

        ctx.lineTo(x + size, y + size - rBottomRight);
        if (rBottomRight) ctx.quadraticCurveTo(x + size, y + size, x + size - rBottomRight, y + size);

        ctx.lineTo(x + rBottomLeft, y + size);
        if (rBottomLeft) ctx.quadraticCurveTo(x, y + size, x, y + size - rBottomLeft);

        ctx.lineTo(x, y + rTopLeft);
        if (rTopLeft) ctx.quadraticCurveTo(x, y, x + rTopLeft, y);

        ctx.closePath();

        ctx.stroke();
        if (fill) {
            ctx.fill();
        }
    }

    /**
     * Draw a single positional pattern eye.
     */
    private drawPositioningPattern(
        ctx: CanvasRenderingContext2D,
        cellSize: number,
        offset: number,
        row: number,
        col: number,
        color: EyeColor,
        radii: CornerRadii = [0, 0, 0, 0],
        position: number) {

        const lineWidth = Math.ceil(cellSize);

        let radiiOuter;
        let radiiInner;
        if (typeof radii !== 'number' && !Array.isArray(radii)) {
            radiiOuter = radii.outer || 0;
            radiiInner = radii.inner || 0;
        } else {
            radiiOuter = radii as CornerRadii;
            radiiInner = radiiOuter;
        }

        let colorOuter;
        let colorInner;
        if (typeof color !== 'string') {
            colorOuter = color.outer;
            colorInner = color.inner;
        } else {
            colorOuter = color;
            colorInner = color;
        }

        let y = (row * cellSize) + offset;
        let x = (col * cellSize) + offset;
        let size = cellSize * 7;

        // Outer box
        if(position == 3) {
            size = cellSize * 6;
            y = (row * cellSize) + offset + 5;
            x = (col * cellSize) + offset + 5;
            this.drawLifeTaggerImage(x, y, size, ctx, colorOuter);
        } else {
            if (position < 3) {
                this.drawRoundedSquare(lineWidth, x, y, size, colorOuter, radiiOuter, false, ctx);
            }
        }

        // Inner box
        size = cellSize * 3;
        y += cellSize * 2;
        x += cellSize * 2;
        if (position < 3) {
            this.drawRoundedSquare(lineWidth, x, y, size, colorInner, radiiInner, true, ctx);
        }


    };

    private drawLifeTaggerImage(x, y, size, ctx, colorInner) {
        const lifeTaggerSVG = `<svg viewBox="0 0 114 115" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect y="42" width="64" height="6" fill="${colorInner}"/>
<rect x="46" width="18" height="6" fill="${colorInner}"/>
<rect x="46" y="14" width="18" height="6" fill="${colorInner}"/>
<rect x="46" y="30" width="18" height="6" fill="${colorInner}"/>
<rect x="52" width="36" height="6" transform="rotate(90 52 0)" fill="${colorInner}"/>
<rect x="24" width="18" height="6" fill="${colorInner}"/>
<rect x="24" y="14" width="16" height="6" fill="${colorInner}"/>
<rect width="6" height="48" fill="${colorInner}"/>
<rect x="12" width="6" height="36" fill="${colorInner}"/>
<rect x="24" width="6" height="36" fill="${colorInner}"/>
<path d="M1.52937 55.2273V63.9614H0V55.2273H1.52937ZM0.26286 63.9614V62.5516H5.17356V63.9614H0.26286Z" fill="${colorInner}"/>
<path d="M9.03386 55.2273V63.9614H7.50449V55.2273H9.03386Z" fill="${colorInner}"/>
<path d="M13.5746 55.2273V63.9614H12.0453V55.2273H13.5746ZM17.4458 56.6372H12.1647V55.2273H17.4458V56.6372ZM16.8245 60.3889H12.1409V59.0149H16.8245V60.3889Z" fill="${colorInner}"/>
<path d="M25.3243 63.9614H19.8998V55.2273H25.3243V56.6372H20.8915L21.4292 56.1473V58.8835H24.918V60.2336H21.4292V63.0414L20.8915 62.5516H25.3243V63.9614Z" fill="${colorInner}"/>
<path d="M31.738 64.1048C30.8857 64.1048 30.1449 63.9216 29.5157 63.5552C28.8944 63.1808 28.4085 62.6591 28.058 61.99C27.7155 61.3129 27.5442 60.5164 27.5442 59.6004C27.5442 58.6923 27.7195 57.8997 28.0699 57.2227C28.4284 56.5456 28.9302 56.0199 29.5754 55.6455C30.2206 55.2711 30.9654 55.0839 31.8097 55.0839C32.5027 55.0839 33.124 55.2114 33.6736 55.4663C34.2232 55.7212 34.6773 56.0796 35.0357 56.5416C35.3942 56.9956 35.6212 57.5373 35.7168 58.1666H34.1038C33.9524 57.6568 33.6696 57.2625 33.2554 56.9837C32.8492 56.6969 32.3514 56.5536 31.7619 56.5536C31.2362 56.5536 30.7742 56.677 30.3759 56.924C29.9856 57.1709 29.6829 57.5214 29.4679 57.9754C29.2528 58.4294 29.1453 58.9711 29.1453 59.6004C29.1453 60.2057 29.2528 60.7394 29.4679 61.2014C29.6829 61.6554 29.9856 62.0099 30.3759 62.2648C30.7742 62.5117 31.2362 62.6352 31.7619 62.6352C32.3593 62.6352 32.8691 62.4918 33.2913 62.2051C33.7214 61.9183 34.0082 61.532 34.1516 61.0461H35.7407C35.6292 61.6515 35.3862 62.1851 35.0118 62.6471C34.6454 63.1091 34.1794 63.4676 33.6139 63.7225C33.0563 63.9774 32.431 64.1048 31.738 64.1048Z" fill="${colorInner}"/>
<path d="M46.145 59.5884C46.145 60.4726 45.9658 61.2572 45.6073 61.9422C45.2489 62.6193 44.7511 63.149 44.1138 63.5313C43.4766 63.9137 42.7398 64.1048 41.9034 64.1048C41.075 64.1048 40.3422 63.9137 39.7049 63.5313C39.0677 63.149 38.5699 62.6193 38.2114 61.9422C37.8609 61.2651 37.6857 60.4845 37.6857 59.6004C37.6857 58.7082 37.8649 57.9236 38.2234 57.2466C38.5818 56.5615 39.0757 56.0278 39.7049 55.6455C40.3422 55.2632 41.079 55.072 41.9154 55.072C42.7517 55.072 43.4846 55.2632 44.1138 55.6455C44.7511 56.0278 45.2489 56.5575 45.6073 57.2346C45.9658 57.9117 46.145 58.6963 46.145 59.5884ZM44.544 59.5884C44.544 58.9671 44.4364 58.4294 44.2214 57.9754C44.0063 57.5214 43.7036 57.1709 43.3133 56.924C42.923 56.6691 42.457 56.5416 41.9154 56.5416C41.3817 56.5416 40.9157 56.6691 40.5174 56.924C40.1271 57.1709 39.8244 57.5214 39.6094 57.9754C39.3943 58.4294 39.2868 58.9671 39.2868 59.5884C39.2868 60.2097 39.3943 60.7514 39.6094 61.2134C39.8244 61.6674 40.1271 62.0179 40.5174 62.2648C40.9157 62.5117 41.3817 62.6352 41.9154 62.6352C42.457 62.6352 42.923 62.5117 43.3133 62.2648C43.7036 62.0099 44.0063 61.6554 44.2214 61.2014C44.4364 60.7394 44.544 60.2017 44.544 59.5884Z" fill="${colorInner}"/>
<path d="M51.7981 63.9614H48.6557V55.2273H51.7145C52.5747 55.2273 53.3314 55.4145 53.9846 55.7889C54.6378 56.1553 55.1476 56.6691 55.514 57.3302C55.8884 57.9834 56.0755 58.7441 56.0755 59.6123C56.0755 60.4646 55.8923 61.2213 55.5259 61.8825C55.1675 62.5356 54.6657 63.0454 54.0205 63.4118C53.3832 63.7782 52.6424 63.9614 51.7981 63.9614ZM50.1851 55.9323V63.2684L49.4563 62.5516H51.6547C52.2362 62.5516 52.738 62.4321 53.1602 62.1931C53.5824 61.9541 53.905 61.6156 54.128 61.1775C54.351 60.7394 54.4625 60.2177 54.4625 59.6123C54.4625 58.991 54.347 58.4613 54.116 58.0232C53.885 57.5771 53.5545 57.2346 53.1243 56.9956C52.6942 56.7567 52.1765 56.6372 51.5711 56.6372H49.4563L50.1851 55.9323Z" fill="${colorInner}"/>
<path d="M64 63.9614H58.5755V55.2273H64V56.6372H59.5672L60.1049 56.1473V58.8835H63.5938V60.2336H60.1049V63.0414L59.5672 62.5516H64V63.9614Z" fill="${colorInner}"/>
</svg>`

        let blob = new Blob([lifeTaggerSVG], {type: 'image/svg+xml'});
        let url = URL.createObjectURL(blob);
        let eyeImage = new Image();
        
        eyeImage.onload = () => {
            ctx.save();
            ctx.drawImage(eyeImage, x, y, size, size)
            ctx.restore();
        };
        eyeImage.src = url;
    }

    /**
     * Is this dot inside a positional pattern zone.
     */
    private isInPositioninZone(col: number, row: number, zones: ICoordinates[]) {
        return zones.some((zone) => (
            row >= zone.row && row <= zone.row + 7 &&
            col >= zone.col && col <= zone.col + 7
        ));
    }

    private transformPixelLengthIntoNumberOfCells(pixelLength: number, cellSize: number) {
        return pixelLength / cellSize;
    }

    private generateRGBKey (uuid : string) {
        const hash = Array.from(uuid).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        return `rgb(${r}, ${g}, ${b})`;
    };
      
    private getRGBKey () {
        return rgbKey;
    };

    private isCoordinateInImage(col: number, row: number, dWidthLogo: number, dHeightLogo: number, dxLogo: number, dyLogo: number, cellSize: number, logoImage: string) {
        if (logoImage) {
            const numberOfCellsMargin = 2;
            const firstRowOfLogo = this.transformPixelLengthIntoNumberOfCells(dxLogo, cellSize);
            const firstColumnOfLogo = this.transformPixelLengthIntoNumberOfCells(dyLogo, cellSize);
            const logoWidthInCells = this.transformPixelLengthIntoNumberOfCells(dWidthLogo, cellSize) - 1;
            const logoHeightInCells = this.transformPixelLengthIntoNumberOfCells(dHeightLogo, cellSize) - 1;

            return row >= firstRowOfLogo - numberOfCellsMargin && row <= firstRowOfLogo + logoWidthInCells + numberOfCellsMargin // check rows
                && col >= firstColumnOfLogo - numberOfCellsMargin && col <= firstColumnOfLogo + logoHeightInCells + numberOfCellsMargin // check cols
        } else {
            return false;
        }
    }

    constructor(props: IProps) {
        super(props);
        this.canvas = React.createRef();
    }

    shouldComponentUpdate(nextProps: IProps) {
        return !isEqual(this.props, nextProps);
    }

    componentDidMount() {
        this.update();
    }

    componentDidUpdate() {
        this.update();
    }

    update() {
        const {
            value,
            ecLevel,
            enableCORS,
            size,
            quietZone,
            bgColor,
            fgColor,
            logoImage,
            logoWidth,
            logoHeight,
            logoOpacity,
            removeQrCodeBehindLogo,
            qrStyle,
            eyeRadius,
            eyeColor,
            authenticated,
        } = this.props;

        const qrCode = qrGenerator(0, ecLevel);
        qrCode.addData(QRCode.utf16to8(value));
        qrCode.make();

        const canvas: HTMLCanvasElement = this.canvas.current as HTMLCanvasElement;
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

        const canvasSize = +size + (2 * +quietZone);
        const length = qrCode.getModuleCount();
        const cellSize = size / length;
        const scale = (window.devicePixelRatio || 1);
        canvas.height = canvas.width = canvasSize * scale;
        ctx.scale(scale, scale);

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        console.log('authenticated', authenticated);
        console.log('value', value);

        if (authenticated && value.includes('uuid')) {
            rgbKey = this.generateRGBKey(value); // save it for external access
            const [r, g, b] = rgbKey.match(/\d+/g).map(Number);
            const color = `rgba(${r}, ${g}, ${b}, 0.99)`; // near-invisible to human eye
          
            // Draw color in the bottom-right corner (or anywhere unlikely to be overwritten)
            const boxSize = cellSize * 2;
            ctx.fillStyle = color;
            // Top-right corner just inside the canvas, avoiding quiet zone
            ctx.fillRect(canvasSize - boxSize - 1, quietZone + 1, boxSize, boxSize);
          }

        const offset = +quietZone;

        const dWidthLogo = logoWidth || size * 0.2;
        const dHeightLogo = logoHeight || dWidthLogo;
        const dxLogo = ((size - dWidthLogo) / 2);
        const dyLogo = ((size - dHeightLogo) / 2);

        const positioningZones: ICoordinates[] = [
            { row: 0, col: 0 },
            { row: 0, col: length - 7 },
            { row: length - 7, col: 0 },
            { row: length - 4, col: length - 4 },
        ];

        ctx.strokeStyle = fgColor;
        if (qrStyle === 'dots') {
            ctx.fillStyle = fgColor;
            const radius = cellSize / 2;
            for (let row = 0; row < length; row++) {
                for (let col = 0; col < length; col++) {
                    if (qrCode.isDark(row, col) && !this.isInPositioninZone(row, col, positioningZones) && !(removeQrCodeBehindLogo && this.isCoordinateInImage(row, col, dWidthLogo, dHeightLogo, dxLogo, dyLogo, cellSize, logoImage))) {
                        ctx.beginPath();
                        ctx.arc(
                            Math.round(col * cellSize) + radius + offset,
                            Math.round(row * cellSize) + radius + offset,
                            (radius / 100) * 75,
                            0,
                            2 * Math.PI,
                            false);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
        } else {
            for (let row = 0; row < length; row++) {
                for (let col = 0; col < length; col++) {
                    if (qrCode.isDark(row, col) && !this.isInPositioninZone(row, col, positioningZones) && !(removeQrCodeBehindLogo && this.isCoordinateInImage(row, col, dWidthLogo, dHeightLogo, dxLogo, dyLogo, cellSize, logoImage))) {
                        ctx.fillStyle = fgColor;
                        const w = (Math.ceil((col + 1) * cellSize) - Math.floor(col * cellSize));
                        const h = (Math.ceil((row + 1) * cellSize) - Math.floor(row * cellSize));
                        ctx.fillRect(Math.round(col * cellSize) + offset, Math.round(row * cellSize) + offset, w, h);
                    }
                }
            }
        }

        // Draw positioning patterns
        for (let i = 0; i < 4; i++) {
            const { row, col } = positioningZones[i];

            let radii = eyeRadius;
            let color;

            if (Array.isArray(radii)) {
                radii = radii[i];
            }
            if (typeof radii == 'number') {
                radii = [radii, radii, radii, radii];
            }

            if (!eyeColor) { // if not specified, eye color is the same as foreground, 
                color = fgColor;
            } else {
                if (Array.isArray(eyeColor)) { // if array, we pass the single color
                    color = eyeColor[i];
                } else {
                    color = eyeColor as EyeColor;
                }
            }

            this.drawPositioningPattern(ctx, cellSize, offset, row, col, color, radii as CornerRadii, i);
        }

        if (logoImage) {
            const image = new Image();
            if (enableCORS) {
                image.crossOrigin = 'Anonymous';
            }
            image.onload = () => {
                ctx.save();
                ctx.globalAlpha = logoOpacity;
                ctx.drawImage(image, dxLogo + offset, dyLogo + offset, dWidthLogo, dHeightLogo);
                ctx.restore();
            };
            image.src = logoImage;
        }
    }

    render() {
        const size = +this.props.size + (2 * +this.props.quietZone);
        return React.createElement('canvas', {
            id: this.props.id ?? 'react-qrcode-logo',
            height: size,
            width: size,
            style: { height: size + 'px', width: size + 'px' },
            ref: this.canvas
        });
    }
}
