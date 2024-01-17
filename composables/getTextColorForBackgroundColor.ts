interface IRGBColor {
    r: number;
    g: number;
    b: number;
}

function getTextColorForBackgroundColor(backgroundColor: IRGBColor): string {
    // Calculate the relative luminance of the background color
    const luminance =
        (0.299 * backgroundColor.r +
            0.587 * backgroundColor.g +
            0.114 * backgroundColor.b) /
        255;

    // Choose black or white text color based on the luminance
    if (luminance > 0.5) {
        return "black"; // Use black text for light background colors
    } else {
        return "white"; // Use white text for dark background colors
    }
}

export default getTextColorForBackgroundColor;
