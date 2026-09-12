/**
 * Matnni vaqtinchalik xotiraga nusxalash.
 *
 * `@capacitor/clipboard` plagini OʻRNATILMAGAN, shuning uchun brauzer API si
 * ishlatiladi. Capacitor Androidʻda sahifani `https://localhost` dan
 * beradi — bu xavfsiz kontekst, demak `navigator.clipboard` mavjud boʻlishi
 * kerak. Lekin "kerak" yetarli emas: eski WebView, ruxsat rad etilishi yoki
 * fokusning yoʻqolishi uni ishlamay qoʻyishi mumkin.
 *
 * Shuning uchun funksiya MUVAFFAQIYATNI qaytaradi va hech qachon istisno
 * otmaydi: chaqiruvchi ekran natijaga qarab "nusxalandi" yoki "nusxalanmadi"
 * deb ayta oladi. Muvaffaqiyatsizlikni jimgina yutish — foydalanuvchi boʻsh
 * buferni qoʻyishga urinib, nima notoʻgʻri ketganini tushunmasligi demak.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Zaxira yoʻlga oʻtamiz.
  }

  return copyWithTextarea(text);
}

/**
 * Zaxira yoʻl: ekrandan tashqaridagi maydon orqali `execCommand`.
 *
 * `document.execCommand` eskirgan, lekin `navigator.clipboard` mavjud
 * boʻlmagan WebViewʻda yagona ishlaydigan yoʻl.
 */
function copyWithTextarea(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  // Ekrandan tashqarida: koʻrinadigan joyga qoʻyilsa sahifa sakrab ketardi.
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '-9999px';
  field.style.opacity = '0';

  document.body.appendChild(field);

  try {
    field.select();
    field.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
  }
}
