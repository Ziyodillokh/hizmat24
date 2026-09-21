import type { MasterApplication, MasterApplicationStatus } from '@prisma/client';

/**
 * Ilova koʻradigan javob — oʻz arizasining holati.
 *
 * Ataylab qisqa: mijoz ilovasiga moderator kimligi ham, ichki
 * identifikatorlar ham kerak emas.
 */
export interface MyApplicationView {
  id: string;
  status: MasterApplicationStatus;
  /** Rad etilgan boʻlsa — sabab; boshqa holatda DOIM `null`. */
  rejectionReason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export const toMyApplicationView = (application: MasterApplication): MyApplicationView => ({
  id: application.id,
  status: application.status,
  rejectionReason: application.rejectionReason,
  createdAt: application.createdAt,
  reviewedAt: application.reviewedAt,
});

/** Panel roʻyxatidagi qator — kartani ochmasdan saralash uchun yetarli. */
export interface AdminApplicationListItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  profession: string;
  status: MasterApplicationStatus;
  /**
   * Foydalanuvchi «sertifikatim bor» dedi. Bu TEKSHIRILMAGAN daʼvo —
   * maydon nomi ham shuni aytadi, panel yonida belgi chiqaradi.
   */
  claimsCertificate: boolean;
  createdAt: Date;
}

/** Ariza kartasi — moderator qaror qabul qilishi uchun barcha maʼlumot. */
export interface AdminApplicationDetail extends AdminApplicationListItem {
  experienceLevel: string;
  about: string;
  districts: string[];
  workFrom: number;
  workTo: number;
  requestedCategoryIds: string[];
  rejectionReason: string | null;
  reviewedByAdminId: string | null;
  reviewedAt: Date | null;
  masterId: string | null;
}

export const toAdminListItem = (application: MasterApplication): AdminApplicationListItem => ({
  id: application.id,
  fullName: application.fullName,
  phoneNumber: application.phoneNumber,
  profession: application.profession,
  status: application.status,
  claimsCertificate: application.claimsCertificate,
  createdAt: application.createdAt,
});

export const toAdminDetail = (application: MasterApplication): AdminApplicationDetail => ({
  ...toAdminListItem(application),
  experienceLevel: application.experienceLevel,
  about: application.about,
  districts: application.districts,
  workFrom: application.workFrom,
  workTo: application.workTo,
  requestedCategoryIds: application.requestedCategoryIds,
  rejectionReason: application.rejectionReason,
  reviewedByAdminId: application.reviewedByAdminId,
  reviewedAt: application.reviewedAt,
  masterId: application.masterId,
});
