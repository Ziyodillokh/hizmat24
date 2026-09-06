/**
 * Ekranlar reyestrini to'ldirish. Har bir bosqich o'z faylida ro'yxatdan o'tadi,
 * shunda 13-bo'limdagi tartib kodda ham ko'rinib turadi.
 */
import { registerStage1 } from './stage1/index';
import { registerStage2 } from './stage2/index';
import { registerStage3 } from './stage3/index';
import { registerStage4 } from './stage4/index';
import { registerStage5 } from './stage5/index';

registerStage1();
registerStage2();
registerStage3();
registerStage4();
registerStage5();
