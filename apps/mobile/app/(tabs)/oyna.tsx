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

export default function PlayScreen() {
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
      <ClubIdentity kicker="Oyna" title="Oyun merkezi" subtitle="Defter kapalı" />
      <Text muted>
        Puan, tahmin ve bilgi yarışması sonraki fazda. Modüller yerinde; rakam yok.
      </Text>
      <SectionHeader title="Modüller" quiet />
      <HubModule
        index="01"
        icon="flash-outline"
        title="Puan"
        detail="Sunucu defteri, tavan ve işlem bütünlüğü. İstemci yazamaz."
      />
      <HubModule
        index="02"
        icon="football-outline"
        title="Tahmin"
        detail="Kilit, maç sonucu, sunucu settlement."
      />
      <HubModule
        index="03"
        icon="help-circle-outline"
        title="Quiz"
        detail="Günlük bilgi. Sahte sıralama yok."
      />
      <HubModule
        index="04"
        icon="checkbox-outline"
        title="Günlük görevler"
        detail="Sunucu görev tanımı gelince dolar."
      />
      <HubModule
        index="05"
        icon="podium-outline"
        title="Liderlik"
        detail="Sıralama defteri kurulunca görünür."
      />
    </Screen>
  );
}
