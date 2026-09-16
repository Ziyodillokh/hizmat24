import { Info, Warning } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Header } from '@/components/Header';
import { ModeChoiceCards } from '@/components/ModeChoiceCards';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import {
  entryRouteFor,
  masterModeHint,
  MODE_NEXT_PARAM,
  MODE_REASON_PARAM,
  modeHome,
  parseModeReason,
  parseNextRoute,
  switchToastFor,
} from '@/lib/appMode';
import { completedStepCount, REQUIRED_STEP_COUNT } from '@/lib/masterProfile';
import { useMaster } from '../master-store';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import type { UserRole } from '../types';

/**
 * Rejim tanlash — gvardiya tushiradigan YAGONA joy.
 *
 * Bu marshrutda `role` gvardiyasi YOʻQ va hech qachon boʻlmaydi: gvardiya
 * oʻzi tushiradigan sahifani ham qoʻriqlasa, ikki ekran bir-birini cheksiz
 * yoʻnaltiradi.
 *
 * Ekran nima OʻZGARISHINI (rejim) va nima oʻzgarmasligini (maʼlumot) ochiq
 * aytadi — rejim almashtirish hech nimani oʻchirmaydi.
 */
export function ModeScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { role, setRole } = useApp();
  const { profile, isComplete } = useMaster();
  const showToast = useToast();

  const reason = parseModeReason(params.get(MODE_REASON_PARAM));
  const done = completedStepCount(profile);

  const choose = (next: UserRole) => {
    // Joriy rejim — oʻlik tugma qolmaydi: karta uyga qaytaradi, toast yoʻq.
    if (next === role) {
      navigate(modeHome(role), { replace: true });
      return;
    }

    setRole(next);
    showToast(switchToastFor(next));

    const wanted = parseNextRoute(params.get(MODE_NEXT_PARAM), next);
    navigate(wanted ?? entryRouteFor(next, { hasMasterSteps: done > 0 }), { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Rejim"
          // Rolsiz sessiyada qaytadigan joy yoʻq — strelka umuman chizilmaydi.
          onBack={role !== null ? () => navigate(modeHome(role)) : undefined}
        />
      }
    >
      <h1 className="mt-8 text-h1 text-text-primary">Qaysi tomondan kirasiz?</h1>
      <p className="mt-8 text-body text-text-secondary">
        Bitta hisob — ikki rejim. Istalgan vaqt qaytib almashtirasiz.
      </p>

      {reason === 'master' && (
        <Banner variant="warning" icon={Warning} className="mt-16">
          Bu boʻlim usta rejimida ochiladi. Quyidan usta rejimini tanlang — sahifa oʻsha zahoti
          ochiladi.
        </Banner>
      )}

      <ModeChoiceCards
        className="mt-20"
        value={role}
        onChoose={choose}
        masterHint={masterModeHint({ isComplete, done, total: REQUIRED_STEP_COUNT })}
      />

      <Banner variant="info" icon={Info} className="mt-20">
        Ikki rejim ham bitta telefon raqamiga bogʻlangan — alohida hisob ochilmaydi. Rejimni
        almashtirganda buyurtmalaringiz ham, usta profilingiz ham qurilmada saqlanib qoladi.
      </Banner>

      <p className="mt-12 px-4 text-caption text-text-secondary">
        Usta rejimida takliflar shu telefonda berilgan buyurtmalardan keladi — server ulanmagan.
      </p>

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
