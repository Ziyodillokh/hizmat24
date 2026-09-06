import { estimateEtaMinutes, haversineKm } from './geo.util';

describe('haversineKm', () => {
  it('bir xil nuqta uchun 0 qaytaradi', () => {
    expect(haversineKm({ lat: 41.31, lng: 69.24 }, { lat: 41.31, lng: 69.24 })).toBe(0);
  });

  it('Toshkent markazi va Chilonzor orasidagi masofani hisoblaydi', () => {
    // Arrange: taxminan 5 km
    const center = { lat: 41.311081, lng: 69.240562 };
    const chilonzor = { lat: 41.2755, lng: 69.2035 };

    // Act
    const distance = haversineKm(center, chilonzor);

    // Assert
    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(6);
  });

  it('simmetrik: A→B va B→A bir xil', () => {
    const a = { lat: 41.2, lng: 69.1 };
    const b = { lat: 41.4, lng: 69.3 };

    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9);
  });
});

describe('estimateEtaMinutes', () => {
  it('masofa va tezlik asosida daqiqa qaytaradi', () => {
    expect(estimateEtaMinutes(10, 20)).toBe(30);
  });

  it('juda yaqin masofada ham kamida 1 daqiqa qaytaradi', () => {
    expect(estimateEtaMinutes(0.05, 20)).toBe(1);
  });

  it("tezlik musbat bo'lmasa xato tashlaydi", () => {
    expect(() => estimateEtaMinutes(10, 0)).toThrow();
  });
});
