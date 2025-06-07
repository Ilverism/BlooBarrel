export function formatLowPrec(value: number): string {

    const DECIMAL_PRECISION = 1;

    /*
        Format with metric prefix when applicable.
        For example, 1000 becomes 1.0k, 1000000 becomes 1.0M, etc.
    */

    if (value >= 1e3 && value < 1e6) {
        return (value / 1e3).toFixed(DECIMAL_PRECISION) + 'k';
    } else if (value >= 1e6 && value < 1e9) {
        return (value / 1e6).toFixed(DECIMAL_PRECISION) + 'M';
    } else if (value >= 1e9 && value < 1e12) {
        return (value / 1e9).toFixed(DECIMAL_PRECISION) + 'G';
    } else if (value >= 1e12 && value < 1e15) {
        return (value / 1e12).toFixed(DECIMAL_PRECISION) + 'T';
    } else if (value >= 1e15 && value < 1e18) {
        return (value / 1e15).toFixed(DECIMAL_PRECISION) + 'P';
    } else if (value >= 1e18 && value < 1e21) {
        return (value / 1e18).toFixed(DECIMAL_PRECISION) + 'E';
    }

    //If value is less than 1000, return it as is with no decimal places
    return value.toFixed(0);

}