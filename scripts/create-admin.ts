/**
 * Admin hisobini yaratish / parolini yangilash — `npm run admin:create`.
 *
 * Panelga birinchi kirish uchun boshqa yoʻl YOʻQ: roʻyxatdan oʻtish
 * endpointi ataylab yozilmagan. Hisob faqat serverga kira oladigan odam
 * tomonidan, shu buyruq bilan ochiladi.
 *
 * Parol argumentda UZATILMAYDI — u shell tarixida va `ps` roʻyxatida
 * qolib ketardi. Buyruq uni soʻraydi va yozilayotganda ekranda
 * koʻrsatmaydi.
 */
import { AdminRole, PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline';
import { hashPassword } from '../apps/client-api/src/modules/admin/auth/admin-password';
import {
  assessPassword,
  generatePassword,
} from '../apps/client-api/src/modules/admin/auth/password-policy';
import { sectionsFor } from '../apps/client-api/src/modules/admin/admin-permissions';

const prisma = new PrismaClient();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_QUESTION = 'Parol (boʻsh qoldirsangiz kuchli parol oʻzi yaratiladi): ';

/**
 * Savollar ikki yoʻldan biri bilan javob oladi.
 *
 * Terminalda — `readline`, parol yozilganda ekranda koʻrinmaydi. Quvur
 * orqali (`printf ... | npm run admin:create`) — stdin BUTUNLAY oldindan
 * oʻqib olinadi. Ikkinchisi shart: quvur tugashi bilan `readline` yopiladi
 * va bazaga bitta soʻrov yuborilgan orada keyingi savol "readline was
 * closed" xatosiga uchrardi.
 */
const isInteractive = process.stdin.isTTY === true;
const rl = isInteractive ? createInterface({ input: process.stdin, output: process.stdout }) : null;

/** Parol yozilayotganda ekranda koʻrinmasligi uchun chiqishni bosib turadi. */
let maskedPrompt: string | null = null;
if (rl) {
  const output = rl as unknown as { _writeToOutput: (text: string) => void };
  const writeToOutput = output._writeToOutput.bind(rl);
  output._writeToOutput = (text: string) => {
    if (maskedPrompt === null) return writeToOutput(text);
    if (text.includes(maskedPrompt)) writeToOutput(maskedPrompt);
  };
}

const piped: string[] = [];

async function readPipedInput(): Promise<void> {
  if (isInteractive) return;

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  piped.push(...Buffer.concat(chunks).toString('utf8').split('\n'));
}

function ask(question: string, { masked = false } = {}): Promise<string> {
  if (!rl) {
    const answer = piped.shift();
    if (answer === undefined) throw new Error(`Javob berilmadi: ${question.trim()}`);
    process.stdout.write(`${question}${masked ? '' : answer}\n`);
    return Promise.resolve(answer.trim());
  }

  maskedPrompt = masked ? question : null;

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      if (masked) process.stdout.write('\n');
      maskedPrompt = null;
      resolve(answer.trim());
    });
  });
}

function parseRole(raw: string): AdminRole {
  const value = raw.toUpperCase();
  if (value in AdminRole) return AdminRole[value as keyof typeof AdminRole];
  throw new Error(`Notanish rol: ${raw}. Mumkin: ${Object.keys(AdminRole).join(', ')}`);
}

/**
 * Yaratilgan parolni BIR MARTA koʻrsatadi.
 *
 * Boshqa yoʻl yoʻq: hash qaytarib boʻlmaydi, shuning uchun bu — parolni
 * koʻrish mumkin boʻlgan yagona daqiqa. Shu sabab ogohlantirish ham
 * yoziladi.
 */
function announceGenerated(password: string): string {
  console.log('\nKuchli parol yaratildi:\n');
  console.log(`    ${password}\n`);
  console.log('Uni HOZIR parol menejeriga saqlang — boshqa koʻrsatilmaydi.\n');

  return password;
}

function reportProblems(problems: string[]): void {
  console.error('\nParol qabul qilinmadi:');
  for (const problem of problems) console.error(`  • ${problem}`);
}

/**
 * Parolni oladi: boʻsh qoldirilsa oʻzi yaratadi, aks holda siyosatdan
 * oʻtkazadi.
 *
 * Interaktiv rejimda BARCHA muammolar birdaniga koʻrsatilib, qayta
 * soʻraladi — foydalanuvchi xatolarni birma-bir topib yurmasligi kerak.
 * Quvur rejimida qayta soʻrashning maʼnosi yoʻq (javoblar oldindan
 * berilgan), shuning uchun buyruq xato bilan toʻxtaydi.
 */
async function resolvePassword(email: string): Promise<string> {
  for (;;) {
    const entered = await ask(PASSWORD_QUESTION, { masked: true });
    if (entered === '') return announceGenerated(generatePassword());

    const verdict = assessPassword(entered, { email });
    if (!verdict.ok) {
      reportProblems(verdict.problems);
      if (!isInteractive) throw new Error('Parol siyosatdan oʻtmadi');
      console.error('');
      continue;
    }

    if ((await ask('Parolni takrorlang: ', { masked: true })) !== entered) {
      if (!isInteractive) throw new Error('Parollar mos kelmadi');
      console.error('\nParollar mos kelmadi, qaytadan.\n');
      continue;
    }

    return entered;
  }
}

async function main(): Promise<void> {
  await readPipedInput();

  const email = (await ask('Email: ')).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error('Email notoʻgʻri');

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    const confirm = await ask(`"${email}" allaqachon bor. Paroli yangilansinmi? (ha/yoʻq): `);
    if (confirm !== 'ha') {
      console.log('Bekor qilindi.');
      return;
    }
  }

  const fullName = existing ? existing.fullName : await ask('Toʻliq ism: ');
  if (!fullName) throw new Error('Ism boʻsh boʻlmasin');

  const role = existing
    ? existing.role
    : parseRole(await ask(`Rol (${Object.keys(AdminRole).join(' / ')}): `));

  const password = await resolvePassword(email);
  const passwordHash = await hashPassword(password);

  /*
   * Parol yangilanganda TOTP siri ham tozalanadi va barcha sessiyalar
   * bekor qilinadi. Sabab: bu buyruq odatda "hisob oʻgʻirlandi" yoki
   * "parol unutildi" holatida ishlatiladi — eski telefondagi
   * autentifikator va ochiq qolgan sessiyalar bilan kirish yoʻli
   * yopilishi kerak.
   */
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, totpSecret: null, totpEnabledAt: null, isActive: true },
    create: { email, fullName, role, passwordHash },
  });

  const revoked = await prisma.adminSession.updateMany({
    where: { adminId: admin.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log(`\n${existing ? 'Parol yangilandi' : 'Admin yaratildi'}: ${admin.email}`);
  console.log(`Rol: ${admin.role}`);
  console.log(`Boʻlimlar: ${sectionsFor(admin.role).join(', ')}`);
  if (revoked.count > 0) console.log(`Bekor qilingan sessiyalar: ${revoked.count}`);
  console.log('\nBirinchi kirishda QR kod koʻrsatiladi — uni autentifikator ilovasiga qoʻshing.');
}

main()
  .catch((error: unknown) => {
    console.error(`\nXato: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    rl?.close();
    return prisma.$disconnect();
  });
