import {
  ClubIdentity,
  HubModule,
  OfflineState,
  Screen,
  SectionHeader,
  Text,
} from '@/design';
import { useFoundationStatus } from '@/features/shell/FoundationScreen';
import { useNetwork } from '@/lib/network-context';

export default function TribunScreen() {
  const { isOffline, refresh } = useNetwork();
  const status = useFoundationStatus({
    isLoading: false,
    isOffline,
    errorMessage: null,
  });

  if (status === 'offline') {
    return (
      <Screen>
        <OfflineState onRetry={() => void refresh()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ClubIdentity kicker="Tribün" title="Dijital tribün" subtitle="Ses burada toplanacak" />
      <Text muted>
        Forum, sohbet ve moderasyon henüz açık değil. Bu ekran tribünün yerini tutar.
      </Text>
      <SectionHeader title="Alanlar" quiet />
      <HubModule
        index="01"
        icon="chatbubbles-outline"
        title="Maç sohbeti"
        detail="Fikstüre bağlı, kilitli pencere. Canlı akış sonraki faz."
      />
      <HubModule
        index="02"
        icon="grid-outline"
        title="Forum"
        detail="Kulüp, maç, şehir. Konular henüz açılmadı."
      />
      <HubModule
        index="03"
        icon="images-outline"
        title="Maç günü akışı"
        detail="Tribün fotoğrafı ve anlık paylaşımlar. Şimdi boş."
      />
      <HubModule
        index="04"
        icon="pulse-outline"
        title="Taraftar hareketi"
        detail="Varlık ve etkileşim özeti. Sayı uydurulmaz."
      />
      <HubModule
        index="05"
        icon="shield-checkmark-outline"
        title="Moderasyon"
        detail="Rapor, engel, ceza. Sunucu hattı, istemci kelime listesi değil."
      />
    </Screen>
  );
}
