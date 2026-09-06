import { Header } from '@/components/Header';
import { ServiceCard } from '@/components/ServiceCard';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { SERVICE_GROUPS } from '@/mocks/serviceGroups';

/**
 * 07a · Guruh xizmatlari.
 *
 * Qidiruv paneli YOʻQ — guruh ichidagi roʻyxat qisqa.
 * Boʻsh holat ham chizilmaydi: server xizmati yoʻq guruhni umuman qaytarmaydi,
 * shuning uchun bu ekran hech qachon boʻsh boʻlmaydi.
 */
export interface GroupServicesScreenProps {
  groupId?: string;
  loading?: boolean;
}

export function GroupServicesScreen({
  groupId = 'g-electric',
  loading = false,
}: GroupServicesScreenProps) {
  const group = SERVICE_GROUPS.find((item) => item.id === groupId) ?? SERVICE_GROUPS[0];
  const icon = serviceIcon(group.iconKey);

  return (
    <ScreenShell header={<Header variant="inner" title={group.name} />}>
      {loading ? (
        <ul className="mt-4 flex flex-col gap-12">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
              <SkeletonCircle size={44} />
              <div className="flex-1">
                <Skeleton width="55%" height={18} />
                <Skeleton width="35%" height={14} className="mt-8" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 flex flex-col gap-12 pb-bottom-reserve">
          {group.categories.map((category) => (
            <li key={category.id}>
              <ServiceCard
                name={category.name}
                description={category.description}
                price={category.basePrice}
                icon={icon}
                onSelect={() => undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
