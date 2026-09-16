import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closeTopOverlay,
  openOverlayCount,
  registerOverlay,
  resetOverlays,
} from './overlayStack';

beforeEach(() => resetOverlays());

describe('overlayStack', () => {
  it('ochiq qatlam boʻlmasa false', () => {
    expect(closeTopOverlay()).toBe(false);
  });

  it('oxirgi ochilgani birinchi yopiladi', () => {
    const order: string[] = [];
    registerOverlay(() => order.push('birinchi'));
    registerOverlay(() => order.push('ikkinchi'));

    expect(closeTopOverlay()).toBe(true);
    expect(closeTopOverlay()).toBe(true);
    expect(order).toEqual(['ikkinchi', 'birinchi']);
    expect(closeTopOverlay()).toBe(false);
  });

  it('qatlam oʻzi yopilganda stekdan chiqadi', () => {
    const close = vi.fn();
    const unregister = registerOverlay(close);
    unregister();

    expect(openOverlayCount()).toBe(0);
    expect(closeTopOverlay()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('bir xil funksiya ikki marta roʻyxatdan oʻtsa, bittasi olinadi', () => {
    const close = vi.fn();
    const unregister = registerOverlay(close);
    registerOverlay(close);
    unregister();

    expect(openOverlayCount()).toBe(1);
    expect(closeTopOverlay()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
