'use client';

import { useEffect, useState } from 'react';
import { deriveMatchClock } from '@eskisehirspor/shared';
import type { FixtureStatus } from '@eskisehirspor/shared';
import {
  addCardAction,
  addGoalAction,
  addSubstitutionAction,
  finishMatchAction,
  prepareMatchAction,
  reverseEventAction,
  setHalftimeAction,
  startMatchAction,
  startSecondHalfAction,
} from '@/lib/matches/actions';
import type { AdminMatchEvent, AdminPlayer } from '@/lib/matches/queries';

type Team = { id: string; name: string; short_name: string };

export function LiveControls({
  fixtureId,
  status,
  home,
  away,
  homeScore,
  awayScore,
  startedAt,
  secondHalfStartedAt,
  endedAt,
  serverNow,
  players,
  events,
  canCorrect,
}: {
  fixtureId: string;
  status: FixtureStatus;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  startedAt: string | null;
  secondHalfStartedAt: string | null;
  endedAt: string | null;
  serverNow: string;
  players: AdminPlayer[];
  events: AdminMatchEvent[];
  canCorrect: boolean;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [serverNow]);

  const nowMs = Date.parse(serverNow) + elapsedMs;

  const clock = deriveMatchClock({
    status,
    startedAt,
    secondHalfStartedAt,
    endedAt,
    nowMs,
  });

  const [teamId, setTeamId] = useState(home.id);
  const teamPlayers = players.filter((player) => player.team_id === teamId);
  const live = status === 'live';
  const scheduled = status === 'scheduled';
  const halftime = status === 'halftime';

  return (
    <div>
      <p>
        {home.name}
        <br />
        vs
        <br />
        {away.name}
      </p>
      <p style={{ fontSize: 40, margin: '8px 0' }}>
        {homeScore} — {awayScore}
      </p>
      <p>
        {status === 'live' ? '● CANLI' : status === 'halftime' ? 'Devre arası' : status}
      </p>
      <p>Saat: {clock.label ?? '00:00'}</p>

      <div className="row-actions">
        {scheduled ? (
          <>
            <form action={prepareMatchAction}>
              <input type="hidden" name="fixture_id" value={fixtureId} />
              <button type="submit">Hazırla</button>
            </form>
            <form action={startMatchAction}>
              <input type="hidden" name="fixture_id" value={fixtureId} />
              <button type="submit">Başlat</button>
            </form>
          </>
        ) : null}
        {live && !secondHalfStartedAt ? (
          <form action={setHalftimeAction}>
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <button className="secondary" type="submit">
              Devre
            </button>
          </form>
        ) : null}
        {halftime ? (
          <form action={startSecondHalfAction}>
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <button type="submit">İkinci yarı</button>
          </form>
        ) : null}
        {live || halftime ? (
          <form action={finishMatchAction}>
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <button className="secondary" type="submit">
              Maçı bitir
            </button>
          </form>
        ) : null}
      </div>

      {live ? (
        <>
          <h2>Gol</h2>
          <form action={addGoalAction} className="cms-form">
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <label>
              Takım
              <select name="team_id" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
                <option value={home.id}>{home.name}</option>
                <option value={away.id}>{away.name}</option>
              </select>
            </label>
            <label>
              Oyuncu
              <select name="player_id">
                <option value="">Seçilmedi</option>
                {teamPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.shirt_number ? `${player.shirt_number} ` : ''}
                    {player.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dakika
              <input name="minute" type="number" defaultValue={clock.displayMinute ?? ''} />
            </label>
            <label>
              Uzatma
              <input name="extra_minute" type="number" defaultValue={clock.extraMinute ?? ''} />
            </label>
            <button type="submit">Gol ekle</button>
          </form>

          <h2>Kart</h2>
          <form action={addCardAction} className="cms-form">
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <label>
              Takım
              <select name="team_id" defaultValue={home.id}>
                <option value={home.id}>{home.name}</option>
                <option value={away.id}>{away.name}</option>
              </select>
            </label>
            <label>
              Oyuncu
              <select name="player_id" required>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kart
              <select name="card_type">
                <option value="yellow_card">Sarı</option>
                <option value="red_card">Kırmızı</option>
              </select>
            </label>
            <label>
              Dakika
              <input name="minute" type="number" defaultValue={clock.displayMinute ?? ''} />
            </label>
            <button type="submit">Kart ekle</button>
          </form>

          <h2>Değişiklik</h2>
          <form action={addSubstitutionAction} className="cms-form">
            <input type="hidden" name="fixture_id" value={fixtureId} />
            <label>
              Takım
              <select name="team_id" defaultValue={home.id}>
                <option value={home.id}>{home.name}</option>
                <option value={away.id}>{away.name}</option>
              </select>
            </label>
            <label>
              Çıkan
              <select name="player_out_id" required>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Giren
              <select name="player_in_id" required>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dakika
              <input name="minute" type="number" defaultValue={clock.displayMinute ?? ''} />
            </label>
            <button type="submit">Değişiklik ekle</button>
          </form>
        </>
      ) : null}

      <h2>Olaylar</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.reversed_at ? 'İptal · ' : ''}
            {event.minute ?? '—'}
            {event.extra_minute ? `+${event.extra_minute}` : ''}′ {event.event_type}
            {canCorrect && !event.reversed_at ? (
              <form action={reverseEventAction} style={{ display: 'inline', marginLeft: 8 }}>
                <input type="hidden" name="fixture_id" value={fixtureId} />
                <input type="hidden" name="event_id" value={event.id} />
                <button className="secondary" type="submit">
                  Düzelt
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
