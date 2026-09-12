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
      'Kafolatli toʻlov — pul ish tugaguncha platformada saqlanadigan usul — Click va Payme ulangach ishga tushadi. Bugun buyurtma naqd toʻlanadi va pul ilova orqali oʻtmaydi: ishni koʻrib, ustaga oʻzingiz toʻlaysiz. Bugun nima ishlashini «Kafolat va himoya» sahifasida toʻliq oʻqishingiz mumkin.',
  },
  {
    id: 'find-master',
    chip: 'Usta kerak',
    question: 'Menga usta kerak, qanday buyurtma beraman?',
    answer:
      'Bosh sahifadan kerakli xizmatni tanlang, muammoni qisqacha yozing va manzilni koʻrsating. Ustani tizim oʻzi tayinlaydi. Hozir ilova demo rejimida ishlayapti, shuning uchun usta bir necha soniyada tayinlanadi; haqiqiy vaqt backend ulangach maʼlum boʻladi.',
  },
  {
    id: 'refund',
    chip: 'Pul qaytishi',
    question: 'Pulim qanday qaytariladi?',
    answer:
      'Naqd toʻlovda pul ilova orqali oʻtmaydi, shuning uchun platforma uni qaytara olmaydi. Buyurtma bekor qilinsa ham hech qanday pul yechilmaydi — chunki olinmagan ham. Ish sifatsiz boʻlsa, buyurtma sahifasidagi «Muammo haqida xabar» tugmasi murojaat matnini tayyorlaydi va uni qoʻllab-quvvatlashga yuborishingizga yordam beradi.',
  },
  {
    id: 'price',
    chip: 'Narxlar?',
    question: 'Narxlar qanday belgilanadi?',
    answer:
      'Roʻyxatdagi narx — taxminiy. Buyurtma berilganda summa bir marta hisoblanadi va keyin oʻzgarmaydi: chekdagi raqam siz koʻrgan raqam bilan bir xil boʻladi. Ilovada narxni qayta hisoblash oqimi hali yoʻq — usta joyida boshqa summa soʻrasa, toʻlashdan oldin qoʻllab-quvvatlash xizmatiga bogʻlaning.',
  },
  {
    id: 'late',
    chip: 'Kechikish?',
    question: 'Usta kechiksa nima boʻladi?',
    answer:
      'Usta yetib kelgunicha buyurtmani bepul bekor qilishingiz mumkin — jarima yoʻq va hech qanday pul yechilmaydi. Kechikish haqida avtomatik xabar yuborish hali ishlamaydi, shuning uchun holatni buyurtma sahifasidan kuzatasiz. Buyurtma aktiv boʻlganda ustaning raqami ochiq — qoʻngʻiroq qilib soʻrashingiz mumkin.',
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
    refund: ['qaytar', 'pul qayt', 'refund', 'nizo', 'shikoyat', 'murojaat'],
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

  return 'Bu savolga hozircha javob bera olmayman — yordamchi demo rejimida ishlayapti. Qoʻllab-quvvatlash xizmatiga telefon yoki Telegram orqali yozsangiz, odam javob beradi.';
}
