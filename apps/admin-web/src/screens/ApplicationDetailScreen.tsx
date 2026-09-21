import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApplication, type ApplicationDetail } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime } from '@/lib/format';
import {
  EXPERIENCE_LABELS,
  formatDistricts,
  formatWorkHours,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/lib/applications';
import { ApproveForm, RejectForm } from '@/components/ApplicationReview';
import { Button, Card, Notice, PageTitle, Pill } from '@/components/ui';

type Mode = 'view' | 'approve' | 'reject';

/** Ariza kartasi — koʻrish va ikki amal. */
export function ApplicationDetailScreen() {
  const { id = '' } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [mode, setMode] = useState<Mode>('view');

  const query = useQuery({
    queryKey: ['admin', 'applications', id],
    queryFn: () => fetchApplication(token as string, id),
    enabled: Boolean(token) && id.length > 0,
  });

  return (
    <>
      <Link to="/applications" className="text-caption-strong text-primary underline-offset-2 hover:underline">
        ← Arizalar roʻyxati
      </Link>

      {query.isPending && <p className="mt-16 text-body text-text-secondary">Yuklanmoqda…</p>}
      {query.isError && (
        <div className="mt-16">
          <Notice>
            {query.error instanceof ApiError ? query.error.message : 'Arizani yuklab boʻlmadi'}
          </Notice>
        </div>
      )}

      {query.data && (
        <ApplicationCard application={query.data} mode={mode} onMode={setMode} />
      )}
    </>
  );
}

function ApplicationCard({
  application,
  mode,
  onMode,
}: {
  application: ApplicationDetail;
  mode: Mode;
  onMode: (mode: Mode) => void;
}) {
  const isPending = application.status === 'PENDING';

  return (
    <>
      <div className="mt-12 flex items-start justify-between gap-16">
        <PageTitle title={application.fullName} subtitle={application.phoneNumber} />
        <Pill tone={STATUS_TONES[application.status]}>{STATUS_LABELS[application.status]}</Pill>
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <Card className="p-20">
          <h2 className="text-h3 text-text-primary">Kasbi</h2>
          <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
            <dt className="text-text-secondary">Kasb</dt>
            <dd className="text-text-primary">{application.profession}</dd>
            <dt className="text-text-secondary">Tajriba</dt>
            <dd className="text-text-primary">
              {EXPERIENCE_LABELS[application.experienceLevel] ?? application.experienceLevel}
            </dd>
            <dt className="text-text-secondary">Sertifikat</dt>
            <dd className="text-text-primary">
              {/*
                Foydalanuvchining oʻz soʻzi. Yashil belgi YOʻQ — hech kim
                hujjatni koʻrmagan. Tasdiqlash A5 bosqichida alohida amal.
              */}
              {application.claimsCertificate ? (
                <span>
                  bor deb daʼvo qiladi{' '}
                  <Pill tone="neutral">tekshirilmagan</Pill>
                </span>
              ) : (
                'yoʻq'
              )}
            </dd>
            <dt className="text-text-secondary">Tumanlar</dt>
            <dd className="text-text-primary">{formatDistricts(application.districts)}</dd>
            <dt className="text-text-secondary">Ish vaqti</dt>
            <dd className="text-text-primary">
              {formatWorkHours(application.workFrom, application.workTo)}
            </dd>
            <dt className="text-text-secondary">Yuborilgan</dt>
            <dd className="text-text-primary">{formatDateTime(application.createdAt)}</dd>
          </dl>
        </Card>

        <Card className="p-20">
          <h2 className="text-h3 text-text-primary">Oʻzi haqida</h2>
          <p className="mt-12 whitespace-pre-line text-body text-text-primary">{application.about}</p>
          <p className="mt-12 text-caption text-text-secondary">
            Soʻragan xizmatlar: {application.requestedCategoryIds.length} ta
          </p>
        </Card>
      </div>

      {application.status === 'REJECTED' && application.rejectionReason && (
        <div className="mt-16">
          <Notice tone="danger">
            <span className="text-body-strong">Rad etish sababi: </span>
            {application.rejectionReason}
            {application.reviewedAt && (
              <span className="block text-caption">{formatDateTime(application.reviewedAt)}</span>
            )}
          </Notice>
        </div>
      )}

      {application.status === 'APPROVED' && (
        <div className="mt-16">
          <Notice tone="success">
            Tasdiqlangan{application.reviewedAt ? ` · ${formatDateTime(application.reviewedAt)}` : ''}.
            Usta yozuvi yaratildi va u ilovada usta rejimiga kira oladi.
          </Notice>
        </div>
      )}

      {isPending && (
        <Card className="mt-16 p-20">
          {mode === 'view' && (
            <div className="flex flex-wrap gap-8">
              <Button onClick={() => onMode('approve')}>Tasdiqlash</Button>
              <Button variant="danger" onClick={() => onMode('reject')}>
                Rad etish
              </Button>
            </div>
          )}
          {mode === 'approve' && <ApproveForm application={application} onDone={() => onMode('view')} />}
          {mode === 'reject' && <RejectForm application={application} onDone={() => onMode('view')} />}
        </Card>
      )}
    </>
  );
}
