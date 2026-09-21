/**
 * Admin paroli siyosati — SOF mantiq: bazasiz, tarmoqsiz, soatsiz.
 *
 * NEGA alohida modul: bu qoidalar uch joyda kerak boʻladi — `create-admin`
 * buyrugʻida, kelajakdagi "parolni oʻzgartirish" endpointida va testlarda.
 * Ular xizmat ichida yozilsa, CLI ularni chaqira olmay, ikkinchi nusxa
 * paydo boʻlardi va ikkalasi vaqt oʻtib bir-biridan uzoqlashardi.
 */
import { randomInt } from 'node:crypto';

export interface PasswordVerdict {
  ok: boolean;
  /** Oʻzbekcha, aniq muammolar: har biri nima qilish kerakligini aytadi. */
  problems: string[];
}

/**
 * Hisob YARATILGANDA talab qilinadigan eng kam uzunlik.
 *
 * Login DTO sidagi 10 ga ATAYLAB tegilmagan: u kirish soʻrovining shakl
 * tekshiruvi, siyosat emas. Uni 12 ga koʻtarish siyosat oʻzgargan kuni
 * eski parolli adminlarni tizimdan butunlay chiqarib yuborardi — ular
 * parolini almashtira olmay qolardi, chunki kirish ham yopiq.
 */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Ochiq manbada koʻrinib ketgan parollar — MANGU taqiqlangan.
 *
 * NEGA mangu: bu repo GitHub da ommaviy va bu qiymatlar uning tarixida
 * qoladi. Tarixni tozalash ham yordam bermaydi — fork, klon va kesh
 * nusxalari boshqalarda saqlanib qolgan. Shuning uchun ular "eskirgan
 * parol" emas, "hech qachon ishlatilmaydigan qiymat" hisoblanadi.
 *
 * Roʻyxatga test fiksturalari ham kiradi: fikstura qiymati testda ochiq
 * yoziladi, demak u haqiqiy hisobga hech qachon qoʻyilmasligi kerak.
 */
export const LEAKED_PASSWORDS: readonly string[] = [
  // Ommaviy repodagi test fayllarida haqiqiy admin@hizmat24.uz hisobida ishlatilgan.
  'Juda-Kuchli-Parol-2026',
  'Operator-Paroli-2026',
  // Testlarning yangi fikstura qiymati — nomi bilan aytib turibdi.
  'test-fikstura-parol-ishlatilmaydi',
];

/**
 * Email nomi qidiriladigan eng qisqa boʻlak.
 *
 * NEGA chegara bor: "a@x.uz" kabi hisobda nom bitta harf boʻladi va u
 * deyarli har qanday parol ichidan topiladi — chegarasiz tekshiruv barcha
 * parolni rad etib, foydasiz boʻlib qolardi.
 */
const MIN_EMAIL_FRAGMENT_LENGTH = 3;

/**
 * Necha ta ketma-ket belgidan boshlab rad etiladi.
 *
 * NEGA 5: 4 juda qattiq — oddiy soʻzlarda ham uch-toʻrtlik ketma-ketlik
 * uchraydi ("stu", "defo"). 5 esa "12345", "abcde" kabi klaviatura
 * naqshlarini tutadi va tasodifiy parolga amalda tegmaydi.
 */
const SEQUENCE_LIMIT = 5;

/**
 * Taqqoslash uchun yagona koʻrinish.
 *
 * NFKC — Unicode da bir xil koʻringan belgilar turlicha kodlanadi
 * (toʻliq kenglikdagi "Ａ", "ﬁ" ligaturasi); toLowerCase — siyosat
 * registr oʻzgarishi bilan aylanib oʻtilmasligi uchun, yaʼni
 * 'juda-kuchli-parol-2026' ham 'Juda-Kuchli-Parol-2026' kabi rad etiladi.
 */
const canonical = (value: string): string => value.normalize('NFKC').toLowerCase();

/** Tekshiruv tezligi uchun roʻyxat bir marta normallashtiriladi. */
const LEAKED_CANONICAL = new Set(LEAKED_PASSWORDS.map(canonical));

/**
 * Parol sizib chiqqan roʻyxatdami?
 *
 * NEGA `assessPassword` dan ALOHIDA eksport: kirish payti faqat SHU
 * qoida qayta tekshirilishi kerak, qolganlari emas. Bazadagi eski parol
 * uzunlik yoki ketma-ketlik qoidasiga mos kelmasligi mumkin — siyosat
 * ular yozilgandan keyin qatʼiylashgan boʻlsa, toʻliq baholash egasini
 * hisobidan butunlay ayirib qoʻyardi. Sizib chiqqan qiymat esa boshqa
 * toifa: u "eskirgan" emas, hech qachon ishlatilmasligi kerak.
 */
export function isLeakedPassword(password: string): boolean {
  return LEAKED_CANONICAL.has(canonical(password));
}

interface CheckInput {
  /** Foydalanuvchi kiritgan asl matn — uzunlik shu boʻyicha sanaladi. */
  readonly password: string;
  /** Normallashtirilgan nusxa — barcha taqqoslashlar shu boʻyicha. */
  readonly canon: string;
  readonly email: string;
}

/** Qoida buzilgan boʻlsa muammo matnini, aks holda `null` qaytaradi. */
type PasswordCheck = (input: CheckInput) => string | null;

/** Belgilar soni — emoji va surrogat juftliklar yarimta boʻlib sanalmasligi uchun. */
const countCharacters = (value: string): number => Array.from(value).length;

const checkLength: PasswordCheck = ({ password }) => {
  const length = countCharacters(password);
  if (length >= MIN_PASSWORD_LENGTH) return null;

  return `Parol kamida ${MIN_PASSWORD_LENGTH} belgidan iborat boʻlsin — hozir ${length} ta.`;
};

const checkLeaked: PasswordCheck = ({ password }) =>
  isLeakedPassword(password)
    ? 'Bu parol ochiq manbada koʻringan va mangu taqiqlangan — butunlay boshqa parol tanlang.'
    : null;

const emailLocalPart = (email: string): string => canonical(email).split('@')[0] ?? '';

const checkEmail: PasswordCheck = ({ canon, email }) => {
  const local = emailLocalPart(email);
  if (local.length < MIN_EMAIL_FRAGMENT_LENGTH || !canon.includes(local)) return null;

  return `Parol ichida email nomi ("${local}") boʻlmasin — uni birinchi boʻlib sinab koʻrishadi.`;
};

const checkRepetition: PasswordCheck = ({ canon }) => {
  const characters = Array.from(canon);
  if (characters.length < 2 || characters.some((char) => char !== characters[0])) return null;

  return 'Parol bitta belgining takroridan iborat boʻlmasin.';
};

/**
 * Kod nuqtalari boʻyicha oʻsuvchi yoki kamayuvchi ketma-ketlikni qidiradi.
 * Registr allaqachon tushirilgani uchun "ABCDE" ham "abcde" kabi tutiladi.
 */
function hasLongSequence(canon: string): boolean {
  const codes = Array.from(canon, (char) => char.codePointAt(0) ?? 0);
  let direction = 0;
  let run = 1;

  for (let index = 1; index < codes.length; index += 1) {
    const step = codes[index] - codes[index - 1];

    if (step !== 1 && step !== -1) {
      direction = 0;
      run = 1;
    } else if (step === direction) {
      run += 1;
    } else {
      direction = step;
      run = 2;
    }

    if (run >= SEQUENCE_LIMIT) return true;
  }

  return false;
}

const checkSequence: PasswordCheck = ({ canon }) =>
  hasLongSequence(canon)
    ? `Parolda ${SEQUENCE_LIMIT} ta va undan koʻp ketma-ket belgi (masalan 12345 yoki abcde) boʻlmasin.`
    : null;

const CHECKS: readonly PasswordCheck[] = [
  checkLength,
  checkLeaked,
  checkEmail,
  checkRepetition,
  checkSequence,
];

/**
 * Parolni siyosat boʻyicha baholaydi.
 *
 * Barcha qoidalar BIRDANIGA tekshiriladi: foydalanuvchi muammolarni
 * birma-bir topib, har safar qaytadan urinmasligi kerak.
 */
export function assessPassword(password: string, context: { email: string }): PasswordVerdict {
  const input: CheckInput = {
    password,
    canon: canonical(password),
    email: context.email,
  };
  const problems = CHECKS.map((check) => check(input)).filter(
    (problem): problem is string => problem !== null,
  );

  return { ok: problems.length === 0, problems };
}

/**
 * Parol alifbosi — chalkashtiradigan belgilarsiz.
 *
 * 0/O va 1/l/I olib tashlangan: yaratilgan parol koʻpincha ekrandan
 * qoʻlda koʻchiriladi va bu juftliklar aynan shunda xato qildiradi.
 *
 * Hajmi: 24 katta harf + 25 kichik harf + 8 raqam = 57 ta belgi.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Entropiya hisobi: log2(57) ≈ 5.83 bit har bir belgiga.
 * 4 guruh × 5 belgi = 20 belgi → 20 × 5.83 ≈ 116 bit.
 * Talab qilingan 90 bitdan yuqori; defis ajratgichlar qatʼiy joyda
 * turgani uchun entropiyaga hech narsa qoʻshmaydi, faqat oʻqishni
 * osonlashtiradi.
 */
const GROUP_SIZE = 5;
const GROUP_COUNT = 4;

/**
 * Tasodifiy parol qoida boʻyicha rad etilishi juda kam ehtimolli
 * (ketma-ketlik tasodifan tushishi ≈ 10⁻⁶), lekin mumkin. Shuning uchun
 * qayta urinish bor — cheksiz sikl emas, chegara bilan: siyosat kelajakda
 * alifbo bilan sigʻishmay qolsa, buyruq osilib qolmay, xato bilan toʻxtaydi.
 */
const MAX_GENERATE_ATTEMPTS = 20;

const randomCharacter = (): string => ALPHABET[randomInt(ALPHABET.length)];

const buildCandidate = (): string =>
  Array.from({ length: GROUP_COUNT }, () =>
    Array.from({ length: GROUP_SIZE }, randomCharacter).join(''),
  ).join('-');

/** Siyosatdan oʻtishi kafolatlangan kuchli parol yaratadi. */
export function generatePassword(): string {
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
    const candidate = buildCandidate();
    if (assessPassword(candidate, { email: '' }).ok) return candidate;
  }

  throw new Error('Kuchli parol yaratib boʻlmadi — qayta urinib koʻring.');
}
