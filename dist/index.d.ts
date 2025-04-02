import * as React from 'react';
type EyeColor = string | InnerOuterEyeColor;
type InnerOuterEyeColor = {
    inner: string;
    outer: string;
};
type CornerRadii = number | [number, number, number, number] | InnerOuterRadii;
type InnerOuterRadii = {
    inner: number | [number, number, number, number];
    outer: number | [number, number, number, number];
};
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
export declare class QRCode extends React.Component<IProps, {}> {
    private canvas;
    static defaultProps: IProps;
    private static utf16to8;
    /**
     * Draw a rounded square in the canvas
     */
    private drawRoundedSquare;
    /**
     * Draw a single positional pattern eye.
     */
    private drawPositioningPattern;
    private drawLifeTaggerImage;
    /**
     * Is this dot inside a positional pattern zone.
     */
    private isInPositioninZone;
    private transformPixelLengthIntoNumberOfCells;
    private generateRGBKey;
    private getRGBKey;
    private isCoordinateInImage;
    constructor(props: IProps);
    shouldComponentUpdate(nextProps: IProps): boolean;
    componentDidMount(): void;
    componentDidUpdate(): void;
    update(): void;
    render(): React.DetailedReactHTMLElement<{
        id: string;
        height: number;
        width: number;
        style: {
            height: string;
            width: string;
        };
        ref: React.RefObject<HTMLCanvasElement>;
    }, HTMLCanvasElement>;
}
export {};
