/**
 * Hudud chegaralari — YAGONA manba.
 *
 * DTO ham, panel ham shu sonlarga tayanadi: ikki joyda ikki xil chegara
 * turib qolsa, panelda qabul qilingan qiymat serverda rad etilardi.
 */
export const MIN_CITY_NAME_LENGTH = 2;
export const MAX_CITY_NAME_LENGTH = 80;

/**
 * Radius chegarasi. Pastki chegara 1 km — undan kichigi bitta mahallani
 * ham qoplamaydi. Yuqori chegara 100 km: undan kattasi «shahar» degan
 * maʼnoni yoʻqotadi va ustalar yeta olmaydigan joyga buyurtma ochardi.
 */
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 100;
