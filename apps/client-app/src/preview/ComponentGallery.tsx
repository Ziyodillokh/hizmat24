import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Droplet, Inbox, Plug, Search, Zap } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Banner } from '@/components/Banner';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { InfoChip } from '@/components/InfoChip';
import { Input } from '@/components/Input';
import { MasterCard } from '@/components/MasterCard';
import { NotificationRow } from '@/components/NotificationRow';
import { OrderCard } from '@/components/OrderCard';
import { OtpInput } from '@/components/OtpInput';
import { ProgressBar } from '@/components/ProgressBar';
import { RadarBlock } from '@/components/RadarBlock';
import { SearchField } from '@/components/SearchField';
import { SegmentControl } from '@/components/SegmentControl';
import { SelectableChip } from '@/components/SelectableChip';
import { ServiceCard } from '@/components/ServiceCard';
import { ServiceGroupTile } from '@/components/ServiceGroupTile';
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/Skeleton';
import { Spinner } from '@/components/Spinner';
import { StarRating } from '@/components/StarRating';
import { StatusChip } from '@/components/StatusChip';
import { StepDots } from '@/components/StepDots';
import { Stepper } from '@/components/Stepper';
import { Textarea } from '@/components/Textarea';
import { Toast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { PhoneFrame } from './PhoneFrame';
import { GalleryRow, GallerySection } from './GallerySection';
import { ORDER_STATUS, STATUS_CHIPS, type OrderStatus } from '@/lib/orderStateMachine';
import { NOW } from '@/mocks/orders';
import type { ThemeName } from '@/tokens/colors';

const ALL_STATUSES = Object.keys(STATUS_CHIPS) as OrderStatus[];

function Gallery() {
  const [otp, setOtp] = useState('12');
  const [segment, setSegment] = useState('all');
  const [urgent, setUrgent] = useState(false);
  const [chip, setChip] = useState('a');
  const [text, setText] = useState('Kran oqmoqda');

  return (
    <div className="min-h-full bg-surface px-20 py-24">
      <GallerySection title="9.1 · Tugma">
        <GalleryRow label="Variantlar">
          <div className="w-[200px]"><Button variant="primary">Ustani chaqirish</Button></div>
          <div className="w-[200px]"><Button variant="secondary">Bekor qilish</Button></div>
          <div className="w-[200px]"><Button variant="ghost">Oʻzgartirish</Button></div>
          <div className="w-[200px]"><Button variant="destructive">Tasdiqlash</Button></div>
          <div className="w-[240px]"><Button variant="destructive-outline">Yoʻq, bu boshqa odam</Button></div>
        </GalleryRow>
        <GalleryRow label="Holatlar">
          <div className="w-[200px]"><Button disabled>Davom etish</Button></div>
          <div className="w-[200px]"><Button loading>Davom etish</Button></div>
          <div className="w-[160px]"><Button size="small">Barchasini koʻrish</Button></div>
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.2 · Input va Textarea">
        <GalleryRow label="Input">
          <div className="w-[280px]"><Input placeholder="Manzil" /></div>
          <div className="w-[280px]"><Input defaultValue="Chilonzor 9" /></div>
          <div className="w-[280px]"><Input placeholder="Manzil" error="Kamida 5 belgi kiriting" /></div>
          <div className="w-[280px]"><Input placeholder="Manzil" disabled /></div>
        </GalleryRow>
        <GalleryRow label="Textarea">
          <div className="w-[340px]">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
          </div>
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.3 · Qidiruv paneli">
        <div className="w-[340px]"><SearchField placeholder="Xizmat qidirish" /></div>
        <div className="w-[340px]"><SearchField floating placeholder="Manzilni qidirish" /></div>
      </GallerySection>

      <GallerySection title="9.4 · Karta">
        <div className="w-[240px]"><Card>Oddiy karta</Card></div>
        <div className="w-[240px]"><Card state="selected">Tanlangan</Card></div>
      </GallerySection>

      <GallerySection title="9.5 / 9.6 · Grid elementi va xizmat kartasi">
        <div className="flex w-[300px] gap-12">
          <ServiceGroupTile label="Elektrik xizmatlari" icon={Plug} />
          <ServiceGroupTile label="Santexnika" icon={Droplet} />
        </div>
        <div className="w-[340px]">
          <ServiceCard name="Rozetka oʻrnatish" description="Bitta nuqta" price={80_000} icon={Plug} onSelect={() => undefined} />
        </div>
        <div className="w-[340px]">
          <ServiceCard name="Lyustra oʻrnatish" description={null} price={120_000} icon={Plug} />
        </div>
      </GallerySection>

      <GallerySection title="9.7 / 9.28 / 9.12 / 9.11 · Usta, avatar, badge, reyting">
        <GalleryRow label="Avatar">
          <Avatar name="Jasur" size={44} />
          <Avatar name="Akmal" size={64} />
          <Avatar size={80} />
        </GalleryRow>
        <GalleryRow label="Badge">
          <Badge variant="new" />
          <Badge variant="experienced" />
          <Badge variant="certified" />
        </GalleryRow>
        <GalleryRow label="Reyting">
          <StarRating value={4.8} size="sm" showValue />
          <StarRating value={4} size="md" showValue />
          <StarRating value={3} size="lg" onChange={() => undefined} />
        </GalleryRow>
        <GalleryRow label="Usta kartasi">
          <div className="w-[340px]">
            <MasterCard name="Akmal Rahimov" profession="Santexnik" rating={4.8} completedOrders={142} experience="experienced" isCertified onOpen={() => undefined} />
          </div>
          <div className="w-[340px]">
            <MasterCard name="Bekzod Toʻraev" profession="Elektrik" rating={4.2} completedOrders={9} compact />
          </div>
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.8 / 9.13 · Buyurtma va bildirishnoma qatorlari">
        <div className="w-[340px]">
          <OrderCard serviceIcon={Droplet} serviceName="Kran taʼmirlash" status={ORDER_STATUS.CLOSED} createdAt={NOW} now={NOW} price={100_000} onSelect={() => undefined} />
        </div>
        <div className="w-[340px]">
          <NotificationRow type="MASTER_ARRIVED" title="Usta yetib keldi" body="Iltimos, kelgan ustani tasdiqlang" createdAt={NOW} now={NOW} isUnread />
        </div>
        <div className="w-[340px]">
          <NotificationRow type="WORK_COMPLETED" title="Ish yakunlandi" body="Iltimos, ustaning ishini baholang" createdAt={NOW} now={NOW} />
        </div>
      </GallerySection>

      <GallerySection title="9.9 · Status chiplari (10 ta)">
        {ALL_STATUSES.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
      </GallerySection>

      <GallerySection title="9.10 / 9.19 / 9.22 / 9.27 · Boshqaruvlar">
        <GalleryRow label="Toggle">
          <Toggle checked={urgent} onChange={setUrgent} label="Shoshilinch" />
          <Toggle checked onChange={() => undefined} disabled label="Shoshilinch" />
        </GalleryRow>
        <GalleryRow label="InfoChip">
          <InfoChip icon={Clock} tone="primary">Taxminiy vaqt: 15 daqiqa</InfoChip>
          <InfoChip icon={Zap} tone="warning">Shoshilinch</InfoChip>
          <InfoChip>~3-oʻrin</InfoChip>
        </GalleryRow>
        <GalleryRow label="SegmentControl">
          <div className="w-[340px]">
            <SegmentControl
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'all', label: 'Barchasi' },
                { value: 'active', label: 'Aktiv' },
                { value: 'done', label: 'Yakunlangan' },
                { value: 'cancelled', label: 'Bekor qilingan' },
              ]}
            />
          </div>
        </GalleryRow>
        <GalleryRow label="SelectableChip">
          <SelectableChip selected={chip === 'a'} onSelect={() => setChip('a')}>Fikrimdan qaytdim</SelectableChip>
          <SelectableChip selected={chip === 'b'} onSelect={() => setChip('b')}>Juda uzoq kutdim</SelectableChip>
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.21 · OTP kataki">
        <GalleryRow label="Holatlar">
          <OtpInput value={otp} onChange={setOtp} />
          <OtpInput value="123456" onChange={() => undefined} state="error" />
          <OtpInput value="" onChange={() => undefined} state="disabled" />
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.16 / 9.24 / 9.23 · Bosqich va progress">
        <div className="w-full"><Stepper status={ORDER_STATUS.MASTER_EN_ROUTE} /></div>
        <div className="w-full"><Stepper status={ORDER_STATUS.CLOSED} /></div>
        <div className="w-[300px]"><StepDots currentStep={1} /></div>
        <div className="w-[300px]"><ProgressBar value={60} /></div>
        <div className="w-[300px]"><ProgressBar indeterminate /></div>
      </GallerySection>

      <GallerySection title="9.18 / 9.25 / 9.26 · Banner va toast">
        <div className="w-[340px]"><Banner variant="info">Usta ishni boshladi</Banner></div>
        <div className="w-[340px]"><Banner variant="warning">Buyurtma berilgandan keyin uni tahrirlab boʻlmaydi.</Banner></div>
        <div className="w-[340px]"><Banner variant="danger">Kelgan odam suratdagi ustaga oʻxshamasa, tugmani bosing.</Banner></div>
        <div className="w-[340px]"><Toast message="Buyurtma holati yangilandi" /></div>
        <div className="w-[340px] relative h-[36px]"><ConnectionBanner state="reconnecting" /></div>
        <div className="w-[340px] relative h-[36px]"><ConnectionBanner state="stalled" onRefresh={() => undefined} /></div>
      </GallerySection>

      <GallerySection title="9.20 / 9.29 · Skeleton, boʻsh holat, radar">
        <GalleryRow label="Skeleton">
          <SkeletonCircle size={44} />
          <div className="w-[200px]"><SkeletonText lines={3} /></div>
          <Skeleton width={120} height={52} radius="md" />
        </GalleryRow>
        <GalleryRow label="Boʻsh holat">
          <div className="w-[340px]">
            <EmptyState icon={Inbox} title="Bildirishnomalar yoʻq" description="Buyurtma bergach, holat oʻzgarishlari shu yerda koʻrinadi" />
          </div>
          <div className="w-[340px]">
            <EmptyState icon={Search} title="Hech narsa topilmadi" action={{ label: "Barcha xizmatlarni koʻrish", onClick: () => undefined }} />
          </div>
        </GalleryRow>
        <GalleryRow label="Radar">
          <RadarBlock />
          <RadarBlock variant="static" />
        </GalleryRow>
      </GallerySection>

      <GallerySection title="9.14 / 9.15 · Header va pastki navigatsiya">
        <div className="w-full"><Header variant="home" name="Jasur" phone="+998901234567" now={NOW} unreadCount={3} /></div>
        <div className="w-full"><Header variant="inner" title="Barcha xizmatlar" /></div>
        <div className="w-full"><BottomNav active="home" unreadCount={3} onSelect={() => undefined} /></div>
      </GallerySection>

      <GallerySection title="Spinner">
        <Spinner size={16} className="text-primary" />
        <Spinner size={20} className="text-primary" />
        <Spinner size={32} className="text-primary" />
      </GallerySection>
    </div>
  );
}

export function ComponentGallery() {
  const themes: ThemeName[] = ['light', 'dark'];

  return (
    <div className="px-24 py-32">
      <Link to="/" className="text-body text-primary">← Barcha ekranlar</Link>
      <h1 className="mt-12 text-h2 text-text-primary">Komponentlar kutubxonasi</h1>
      <p className="mt-4 text-body text-text-secondary">
        Spetsifikatsiyaning 9-boʻlimi — har bir komponent barcha holatlari bilan.
      </p>

      <div className="mt-24 flex flex-wrap items-start gap-[120px]">
        {themes.map((theme) => (
          <div key={theme} style={{ width: 393 }}>
            <PhoneFrame theme={theme} label={theme === 'dark' ? 'Dark' : 'Light'}>
              <Gallery />
            </PhoneFrame>
          </div>
        ))}
      </div>
    </div>
  );
}
