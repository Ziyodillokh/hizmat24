"""
Brend aktivlarini yasaydi: ilova ikonkasi, splash va ilova ichidagi belgi.

MANBA — loyiha egasi bergan logo (oq belgi koʻk gradient ustida). Bu yerda
belgining SHAKLI aynan saqlanadi, RANGI esa ilovaning turkuaz palitrasiga
oʻtkaziladi: koʻk logo turkuaz ilovada begona koʻrinardi.

Usul: `min(R,G,B)` oq belgining alfa niqobini beradi (oq piksellarda ~255,
koʻk fonda ~0, chekkalarda oraliq qiymat). Shu niqob bilan oq belgi
ilovaning oʻz gradienti ustiga qoʻyiladi — shakl ham, chekkalardagi
tekislash ham buzilmaydi.

Ishga tushirish:
    python3 scripts/build-brand-assets.py <manba.png>
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
BRAND = ROOT / 'src/assets/brand'

# Ilovaning hero gradienti (tokens/colors.ts, light palitra).
HERO_TOP = (0x22, 0xCF, 0xCC)
HERO_MID = (0x14, 0xAE, 0xAB)
HERO_DEEP = (0x0B, 0x7E, 0x7C)


def ramp(t: float) -> tuple:
    """Uch toʻxtashli turkuaz gradient: 0 — chuqur, 1 — yorqin."""
    t = max(0.0, min(1.0, t))
    if t < 0.55:
        a, b, k = HERO_DEEP, HERO_MID, t / 0.55
    else:
        a, b, k = HERO_MID, HERO_TOP, (t - 0.55) / 0.45
    return tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))


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


def tinted_icon(source: Image.Image, size: int) -> Image.Image:
    """Toʻliq ikonka: turkuaz gradient + oq belgi."""
    alpha = mark_alpha(source).resize((size, size), Image.LANCZOS)
    white = Image.new('RGB', (size, size), (255, 255, 255))
    return Image.composite(white, gradient((size, size)), alpha)


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
#   0.78 x 66.6% x 108dp = 56dp  (66dp doira ichida 10dp zaxira)
# Ilgari bu qiymat 0.92 edi va belgi 66,9dp ga chiqib, doira chetiga
# tiqilib qolardi — strelka uchi va "24" kesilishga bir piksel qolgandi.
ADAPTIVE_MARK_SCALE = 0.78

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
    tinted_icon(source, 512).save(BRAND / 'hizmat24-mark.png')
    print('brend aktivlari:', BRAND)

    for folder, size in MIPMAPS.items():
        target = RES / folder
        icon = tinted_icon(source, size)
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
