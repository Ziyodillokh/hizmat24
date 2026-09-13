"""
Brend aktivlarini yasaydi: ilova ikonkasi, splash va ilova ichidagi belgi.

MANBA — loyiha egasi bergan logo (oq belgi koʻk gradient ustida). Belgining
SHAKLI aynan saqlanadi. RANG — logoning OʻZ gradienti: chuqur tungi koʻkdan
(#03123C, past-chap) yorqin osmon koʻkiga (#139BFE, tepa-oʻng). Ilgari rang
ilovaning turkuaz palitrasiga oʻtkazilgan edi; ilova 2026-09-13 da koʻkka
oʻtgach, egasi asl koʻk logoni qaytarishni soʻradi.

Usul: `min(R,G,B)` oq belgining alfa niqobini beradi (oq piksellarda ~255,
koʻk fonda ~0, chekkalarda oraliq qiymat). Shu niqob bilan oq belgi
gradient ustiga BERILGAN MASSHTABDA qoʻyiladi — shakl ham, chekkalardagi
tekislash ham buzilmaydi, belgi atrofidagi boʻsh joy esa boshqariladi.
Manba rasmida belgi kvadratning 60% ini egallaydi; ikonkada u kichikroq
turadi — egasining talabi: "H yaqinroq boʻlib qolgan, uzoqroq qilish kerak".

Ishga tushirish:
    python3 scripts/build-brand-assets.py <manba.png>
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
BRAND = ROOT / 'src/assets/brand'

# Logoning oʻz gradienti — manbaning chetlaridan olingan besh nuqta.
# t — diagonal boʻylab oʻrin: 0 past-chap, 1 tepa-oʻng.
RAMP_STOPS = (
    (0.00, (0x03, 0x12, 0x3C)),
    (0.25, (0x02, 0x1B, 0x5E)),
    (0.50, (0x01, 0x44, 0xD0)),
    (0.75, (0x00, 0x67, 0xFE)),
    (1.00, (0x13, 0x9B, 0xFE)),
)

# Splash ramkasining rangi (capacitor.config.ts → SplashScreen.backgroundColor):
# rasm chetida koʻrinadigan oʻrtacha tus.
SPLASH_FRAME = '#0144D0'


def ramp(t: float) -> tuple:
    """Besh toʻxtashli koʻk gradient: 0 — chuqur, 1 — yorqin."""
    t = max(0.0, min(1.0, t))
    for (t0, a), (t1, b) in zip(RAMP_STOPS, RAMP_STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    return RAMP_STOPS[-1][1]


def gradient(size: tuple) -> Image.Image:
    """Diagonal gradient: past-chapda chuqur, tepa-oʻngda yorqin."""
    w, h = size
    small = Image.new('RGB', (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            px[x, y] = ramp((x / 63 + (1 - y / 63)) / 2)
    return small.resize((w, h), Image.LANCZOS)


def mark_alpha(source: Image.Image) -> Image.Image:
    """Oq belgining alfa niqobi: min(R, G, B)."""
    r, g, b = source.convert('RGB').split()
    return ImageChops.darker(ImageChops.darker(r, g), b)


def tinted_icon(source: Image.Image, size: int, scale: float) -> Image.Image:
    """Toʻliq ikonka: gradient + oq belgi berilgan masshtabda."""
    mark = mark_only(source, size, scale)
    canvas = gradient((size, size)).convert('RGBA')
    canvas.alpha_composite(mark)
    return canvas.convert('RGB')


def mark_only(source: Image.Image, size: int, scale: float, color=(255, 255, 255)) -> Image.Image:
    """Shaffof fonda belgi — adaptiv ikonkaning old qatlami va ilova uchun."""
    alpha = mark_alpha(source)
    box = alpha.point(lambda v: 255 if v > 128 else 0).getbbox()
    cropped = alpha.crop(box)

    side = round(size * scale)
    fitted = cropped.resize((side, side), Image.LANCZOS)

    canvas = Image.new('L', (size, size), 0)
    canvas.paste(fitted, ((size - side) // 2, (size - side) // 2))

    layer = Image.new('RGBA', (size, size), color + (0,))
    layer.paste(color + (255,), mask=canvas)
    layer.putalpha(canvas)
    return layer


def rounded(image: Image.Image, radius_ratio: float) -> Image.Image:
    """Burchaklari yumaloqlangan nusxa — eski (adaptivgacha) ikonka uchun."""
    size = image.size[0]
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=round(size * radius_ratio), fill=255
    )
    out = image.convert('RGBA')
    out.putalpha(mask)
    return out


def circular(image: Image.Image) -> Image.Image:
    size = image.size[0]
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = image.convert('RGBA')
    out.putalpha(mask)
    return out


def splash(source: Image.Image, size: tuple) -> Image.Image:
    """
    Splash: gradient fon va markazdagi belgi.

    Belgi eng qisqa tomonning 38% ini egallaydi — u yerda faqat bitta
    obyekt turadi va u nafas olishi kerak.
    """
    w, h = size
    canvas = gradient(size).convert('RGB')

    alpha = mark_alpha(source)
    box = alpha.point(lambda v: 255 if v > 128 else 0).getbbox()
    side = round(min(w, h) * 0.38)
    fitted = alpha.crop(box).resize((side, side), Image.LANCZOS)

    white = Image.new('RGB', (side, side), (255, 255, 255))
    canvas.paste(white, ((w - side) // 2, (h - side) // 2), fitted)
    return canvas


# Adaptiv ikonkada old qatlam XML tomonidan 16,7% ga siqiladi, yaʼni
# kanvasning 66,6% i qoladi. Android kafolatlaydigan koʻrinadigan doira —
# 108dp dan 66dp. Belgi shu doiraning ichida NAFAS OLISHI kerak:
#   0.64 x 66.6% x 108dp = 46dp  (66dp doira ichida 10dp zaxira har tomonda)
# Ilgari 0.78 (56dp) edi — egasi belgini doira chetiga yaqin deb topdi.
# Undan oldin 0.92 — belgi 66,9dp ga chiqib doiradan oshib ketardi.
ADAPTIVE_MARK_SCALE = 0.64

# Eski (adaptivgacha) ikonka va ilova ichidagi belgi: kvadratning shuncha
# qismi. Adaptiv doiradagi nisbat (46/66 = 70%) bilan bir xil koʻrinsin
# deb tanlangan — ikki turdagi ikonka bir xil "nafas" olsin.
LEGACY_MARK_SCALE = 0.60

MIPMAPS = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}


def main() -> None:
    source = Image.open(sys.argv[1]).convert('RGB')
    BRAND.mkdir(parents=True, exist_ok=True)

    # Ilova ichidagi belgi (kirish ekrani).
    #
    # Gradientli plitka SAQLANADI: tekis bitta rangdagi variant lentaning
    # ustunlar ustidan oʻtishini koʻrsatadigan soyani yoʻqotadi va toʻq
    # temada kontrast yetarli boʻlmaydi.
    tinted_icon(source, 512, LEGACY_MARK_SCALE).save(BRAND / 'hizmat24-mark.png')
    print('brend aktivlari:', BRAND)

    for folder, size in MIPMAPS.items():
        target = RES / folder
        icon = tinted_icon(source, size, LEGACY_MARK_SCALE)
        rounded(icon, 0.22).save(target / 'ic_launcher.png')
        circular(icon).save(target / 'ic_launcher_round.png')
        gradient((size, size)).save(target / 'ic_launcher_background.png')
        mark_only(source, size, ADAPTIVE_MARK_SCALE).save(target / 'ic_launcher_foreground.png')
    print('ikonkalar:', len(MIPMAPS), 'ta zichlik')

    count = 0
    for folder in sorted(RES.glob('drawable*')):
        target = folder / 'splash.png'
        if not target.exists():
            continue
        image = splash(source, Image.open(target).size)
        # Gradient PNG yomon siqiladi (26 ta fayl ~1,8 MB). Dither bilan
        # 256 rangga tushirish hajmni uchdan biriga kamaytiradi va katta
        # maydonda ham chiziq (banding) bermaydi.
        image.quantize(colors=256, dither=Image.FLOYDSTEINBERG).save(target, optimize=True)
        count += 1
    print('splash:', count, 'ta fayl')


if __name__ == '__main__':
    main()
