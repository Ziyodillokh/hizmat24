"""
Panel favikonini brend belgisidan yasaydi.

NEGA skript, tayyor fayl emas: favikon manba logodan kelib chiqadi. Logo
yangilansa, bu skript qayta ishga tushiriladi va ikkala oʻlcham bir zumda
mos boʻladi — qoʻlda chizilgan SVG bilan bunday boʻlmasdi (eski favikon
qalqon+galochka edi va brendga umuman aloqasi yoʻq edi).

Ikki chiqish, ikki xil qaror:
  * favicon-32.png — burchaklari YUMALOQ va belgi KESIB olingan. Brauzer
    yorligʻida ikonka boshqa saytlar yonida turadi; oʻtkir kvadrat u yerda
    begona koʻrinadi. Kesish esa oʻqilishi uchun: manba logoda har tomondan
    20% boʻsh joy bor (ilova ikonkasining xavfsiz zonasi) va 32px da "H"
    atigi ~19px qolib, loyqa chiqadi.
  * favicon-180.png (apple-touch-icon) — burchaklari KVADRAT va shaffof
    piksel yoʻq. iOS bu rasmga OʻZ niqobini qoʻyadi; oldindan yumaloqlansa
    burchaklardagi shaffof joy qora boʻlib chiqadi.

Ishga tushirish (apps/admin-web ichidan):
    python3 scripts/build-favicon.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src/assets/brand/hizmat24-mark.png'
PUBLIC = ROOT / 'public'

# Burchak radiusi — tomonning ulushi. 22% iOS/Android ikonkalaridagi
# odatiy yumaloqlikka yaqin: sezilarli, lekin doira emas.
CORNER_RATIO = 0.22

# Kichik favikon uchun har tomondan shuncha ulush kesiladi. Manbadagi
# boʻshliq 20%, kesishdan keyin 10% qoladi — belgi 32px tile ichida
# ~19px oʻrniga ~25px boʻladi. Butunlay kesib tashlamaymiz: nafassiz
# ikonka yorliqda siqilib koʻrinadi.
SMALL_TRIM_RATIO = 0.10

# Niqob kattaroq oʻlchamda chiziladi va keyin kichraytiriladi — shunda
# burchak yoyi tekis (antialiased) chiqadi; toʻgʻridan-toʻgʻri 32px da
# chizilsa yoy zinapoyaga aylanadi.
SUPERSAMPLE = 8


def trimmed(image: Image.Image, ratio: float) -> Image.Image:
    """Har tomondan berilgan ulushni kesib tashlaydi."""
    side = min(image.size)
    inset = round(side * ratio)
    return image.crop((inset, inset, image.size[0] - inset, image.size[1] - inset))


def rounded(image: Image.Image, size: int) -> Image.Image:
    """Kvadrat rasmni berilgan oʻlchamga keltirib, burchaklarini yumaloqlaydi."""
    resized = image.convert('RGBA').resize((size, size), Image.LANCZOS)

    big = size * SUPERSAMPLE
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, big - 1, big - 1), radius=round(big * CORNER_RATIO), fill=255
    )

    resized.putalpha(mask.resize((size, size), Image.LANCZOS))
    return resized


def square(image: Image.Image, size: int) -> Image.Image:
    """Shaffofsiz kvadrat — iOS oʻz niqobini qoʻyadigan holat uchun."""
    return image.convert('RGB').resize((size, size), Image.LANCZOS)


def main() -> None:
    source = Image.open(SOURCE)
    PUBLIC.mkdir(exist_ok=True)

    rounded(trimmed(source, SMALL_TRIM_RATIO), 32).save(PUBLIC / 'favicon-32.png')
    square(source, 180).save(PUBLIC / 'favicon-180.png')

    print(f'yasaldi: {PUBLIC / "favicon-32.png"}, {PUBLIC / "favicon-180.png"}')


if __name__ == '__main__':
    main()
