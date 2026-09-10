/**
 * AI yordamchi — mock javoblar.
 *
 * DIQQAT: bu haqiqiy AI emas. Backend ulanmagunicha javoblar shu yerdagi
 * tayyor matnlardan keladi. Shuning uchun ekranda buni ochiq aytadigan
 * eslatma turadi — foydalanuvchi savolini yozib, "aqlli" javob kutib
 * aldanmasligi kerak.
 *
 * Tayyor savollar (chip) — foydalanuvchi nima soʻrashi mumkinligini
 * koʻrsatadi va mock javob aynan shu savollarga mos keladi.
 */
export interface AiTopic {
  id: string;
  /** Chipda koʻrinadigan qisqa savol. */
  chip: string;
  /** Foydalanuvchi nomidan yuboriladigan toʻliq savol. */
  question: string;
  answer: string;
}

export const AI_TOPICS: AiTopic[] = [
  {
    id: 'guarantee',
    chip: 'Kafolat?',
    question: 'Kafolat qanday ishlaydi?',
    answer:
      'Toʻlov paytida ixtiyoriy kafolatni tanlasangiz, pulingiz ish tugaguncha platformada saqlanadi. Usta ishni yakunlagach va siz tasdiqlagach — pul ustaga oʻtadi. Usta kelmasa yoki ish bajarilmasa, pul toʻliq qaytariladi. Kafolatli toʻlov Click va Payme ulangach ishga tushadi; hozircha buyurtma naqd toʻlanadi.',
  },
  {
    id: 'find-master',
    chip: 'Usta kerak',
    question: 'Menga usta kerak, qanday buyurtma beraman?',
    answer:
      'Bosh sahifadan kerakli xizmatni tanlang, muammoni qisqacha yozing va manzilni koʻrsating. Ustani tizim oʻzi tayinlaydi — eng yaqin va boʻsh mutaxassisni topadi. Odatda bu 3 daqiqagacha vaqt oladi.',
  },
  {
    id: 'refund',
    chip: 'Pul qaytishi',
    question: 'Pulim qanday qaytariladi?',
    answer:
      'Kafolat ishga tushgach, pul kartangizga 1-3 ish kunida qaytariladi. Hozircha naqd toʻlovda pul ilovada saqlanmaydi — masala usta bilan kelishuv yoki nizo ochish orqali hal qilinadi.',
  },
  {
    id: 'price',
    chip: 'Narxlar?',
    question: 'Narxlar qanday belgilanadi?',
    answer:
      'Roʻyxatdagi narx — taxminiy. Usta kelib ishni koʻrgach yakuniy narxni aytadi. Agar u taxminiy narxdan 20% dan koʻp farq qilsa, siz buyurtmani bekor qilishingiz mumkin va hech narsa toʻlamaysiz.',
  },
  {
    id: 'late',
    chip: 'Kechikish?',
    question: 'Usta kechiksa nima boʻladi?',
    answer:
      'Usta belgilangan vaqtdan 15 daqiqa kechiksa, sizga xabar keladi va buyurtmani bepul bekor qilish tugmasi ochiladi. Kafolat ishga tushgach pul darhol qaytariladi.',
  },
  {
    id: 'rating',
    chip: 'Reyting?',
    question: 'Ustalarning reytingi nimani bildiradi?',
    answer:
      'Reyting — faqat yakunlangan buyurtmalarga qoʻyilgan baholar oʻrtachasi. Har bir baho haqiqiy buyurtmaga bogʻlangan, shuning uchun uni sunʼiy koʻtarib boʻlmaydi.',
  },
];

export const AI_GREETING =
  'Salom! Men Hizmat24 yordamchisiman. Kafolat, toʻlov, narx yoki usta tanlash boʻyicha savol bering.';

/**
 * Erkin yozilgan savolga javob. Mock boʻlgani uchun kalit soʻz boʻyicha
 * mos mavzuni qidiradi; topilmasa — buni ochiq aytadi va odam bilan
 * bogʻlanish yoʻlini beradi.
 */
export function answerFor(text: string): string {
  const needle = text.toLowerCase();
  const keywords: Record<string, string[]> = {
    guarantee: ['kafolat', 'escrow', 'xavfsiz'],
    refund: ['qaytar', 'pul qayt', 'refund'],
    price: ['narx', 'qancha', 'toʻlov', 'tolov'],
    late: ['kechik', 'kelmadi', 'vaqt'],
    rating: ['reyting', 'baho', 'yulduz'],
    'find-master': ['usta', 'buyurtma', 'chaqir'],
  };

  for (const [topicId, words] of Object.entries(keywords)) {
    if (words.some((word) => needle.includes(word))) {
      const topic = AI_TOPICS.find((item) => item.id === topicId);
      if (topic) return topic.answer;
    }
  }

  return 'Bu savolga hozircha javob bera olmayman — yordamchi demo rejimida ishlayapti. Qoʻllab-quvvatlash xizmatiga yozsangiz, operator javob beradi.';
}
