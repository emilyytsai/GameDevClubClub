import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import './Jam.css';

/* ------------------------------------------------------------------
   Data model
   Each edition is one game jam. Status can be:
   - 'upcoming': jam is being set up, not yet announced
   - 'in progress': jam is active, show countdown + join
   - 'past': jam is finished, show final stats

   To run a real jam: replace `liveEndsAt` below with a fixed ISO date
   (e.g. new Date('2026-07-15T23:59:00')) and update `joined`/`itchUrl`.
------------------------------------------------------------------- */

type JamStatus = 'upcoming' | 'in progress' | 'past';

interface JamEdition {
  id: string;
  number: number;
  title: string;
  theme: string;
  status: JamStatus;
  joined: number;
  goal: number;
  itchUrl: string;
  /* finished ('past') editions carry final numbers */
  stats?: {
    participants: number;
    submissions: number;
    ratings: number;
    topGame: string;
    topAuthor: string;
  };
}

/* Keep the live countdown healthy in any session.
   Anchored once on load — swap for a fixed date for a real jam. */
const liveEndsAt = new Date(Date.now() + 1000 * 60 * 60 * 38 + 1000 * 60 * 23);

const EDITIONS: JamEdition[] = [
  {
    id: 'gdcc-01',
    number: 1,
    title: 'Summer Jam',
    theme: 'TBD',
    status: 'upcoming',
    joined: 0,
    goal: 200,
    itchUrl: 'https://itch.io/jams',
  },
];

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------- */

/* Active jams show countdown + join meter. */
function isActive(jam: JamEdition): boolean {
  return jam.status === 'in progress';
}

function isUpcoming(jam: JamEdition): boolean {
  return jam.status === 'upcoming';
}

interface TimeLeft { days: number; hours: number; mins: number; secs: number; done: boolean; }

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, done: true };
  const secs = Math.floor(diff / 1000) % 60;
  const mins = Math.floor(diff / 1000 / 60) % 60;
  const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);
  return { days, hours, mins, secs, done: false };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/* ------------------------------------------------------------------
   Countdown
------------------------------------------------------------------- */

function Countdown({ target }: { target: Date }) {
  const [left, setLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const cells: { label: string; value: string }[] = [
    { label: 'DAYS', value: pad(left.days) },
    { label: 'HRS', value: pad(left.hours) },
    { label: 'MIN', value: pad(left.mins) },
    { label: 'SEC', value: pad(left.secs) },
  ];

  if (left.done) {
    return (
      <div className="font-bebas text-3xl tracking-widest text-(--pale)">
        SUBMISSIONS CLOSED
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {cells.map((c, i) => (
        <div key={c.label} className="flex items-end gap-2 sm:gap-3">
          <div className="jam-clock-cell flex flex-col items-center">
            <span className="font-bebas text-4xl sm:text-5xl leading-none text-(--pale) tabular-nums">
              {c.value}
            </span>
            <span className="font-cascadia text-[0.6rem] tracking-[0.2em] text-(--pale)/80 mt-1">
              {c.label}
            </span>
          </div>
          {i < cells.length - 1 && (
            <span className="font-bebas text-3xl sm:text-4xl text-(--pale)/40 pb-3">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Join meter — animates toward the goal on mount / selection
------------------------------------------------------------------- */

function JoinMeter({ joined, goal }: { joined: number; goal: number }) {
  const pct = Math.min(100, Math.round((joined / goal) * 100));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setWidth(pct), 120);
    return () => window.clearTimeout(id);
  }, [pct]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-bebas text-2xl text-(--pale) tracking-wide">
          {joined}
          <span className="text-(--pale)/60"> / {goal} joined</span>
        </span>
        <span className="font-cascadia text-sm text-(--pale)/90">{pct}%</span>
      </div>
      <div className="h-5 w-full rounded-full bg-(--blackberry)/30 overflow-hidden ring-1 ring-(--pale)/30">
        <div
          className="jam-meter-fill h-full rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="font-cascadia text-xs text-(--pale)/80 mt-2">
        {goal - joined > 0
          ? `Just ${goal - joined} more devs to hit the goal.`
          : `Goal has been reached!`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------
   Theme word — letters pop in
------------------------------------------------------------------- */

function ThemeWord({ text }: { text: string }) {
  const chars = useMemo(() => text.split(''), [text]);
  return (
    <h2 className="font-hiruko text-(--blackberry) leading-none text-5xl sm:text-7xl md:text-8xl text-center break-words">
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="jam-theme-char"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </h2>
  );
}

/* ------------------------------------------------------------------
   Hero — adapts to upcoming / active vs finished editions
------------------------------------------------------------------- */

function Hero({ jam }: { jam: JamEdition }) {
  const active = isActive(jam);
  const upcoming = isUpcoming(jam);

  return (
    <motion.div
      key={jam.id}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
    >
      {/* ---- green status / timer strip ---- */}
      <div
        className="relative rounded-2xl px-6 py-6 sm:px-10 sm:py-8 shadow-xl flex flex-col items-center gap-5 text-center"
        style={{ background: 'linear-gradient(135deg, var(--verdant), var(--leaf))' }}
      >
        <div className="flex items-center gap-2">
          {upcoming ? (
            <span className="font-cascadia text-sm uppercase tracking-[0.25em] text-(--pale)">
              Coming soon
            </span>
          ) : active ? (
            <>
              <span className="jam-live-dot h-3 w-3 rounded-full bg-(--strawberry2)" />
              <span className="font-cascadia text-sm uppercase tracking-[0.25em] text-(--pale)">
                Live now — submissions close in
              </span>
            </>
          ) : (
            <span className="font-cascadia text-sm uppercase tracking-[0.25em] text-(--pale)">
              Wrapped — the results are in
            </span>
          )}
        </div>

        {upcoming ? (
          <div className="font-capriola text-2xl text-(--pale) tracking-wide">
            Details coming soon
          </div>
        ) : active ? (
          <Countdown target={liveEndsAt} />
        ) : (
          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            <Stat value={jam.stats!.participants} label="DEVS" />
            <Stat value={jam.stats!.submissions} label="GAMES" />
            <Stat value={jam.stats!.ratings} label="RATINGS" />
          </div>
        )}

        <div className="w-full max-w-xl mt-1">
          {upcoming ? (
            <p className="font-cascadia text-sm text-(--pale)">
              Theme, dates, and submission details will be announced here.
            </p>
          ) : active ? (
            <JoinMeter joined={jam.joined} goal={jam.goal} />
          ) : (
            <p className="font-cascadia text-sm text-(--pale)">
              Winner: <span className="font-bebas text-xl text-(--pale) tracking-wide">{jam.stats!.topGame}</span>
              <span className="text-(--pale)/70"> by {jam.stats!.topAuthor}</span>
            </p>
          )}
        </div>
      </div>

      {/* ---- orange THEME hero + straddling join pill ---- */}
      <div
        className="relative rounded-2xl mt-5 px-6 pt-10 pb-20 sm:px-10 sm:pt-14 sm:pb-24 shadow-2xl flex flex-col items-center"
        style={{ background: 'linear-gradient(160deg, var(--orange), #ffb347)' }}
      >
        <span className="font-cascadia text-sm uppercase tracking-[0.3em] text-(--blackberry)/70 mb-4">
          {upcoming ? 'The first jam' : active ? 'This jam\u2019s theme' : 'The theme was'}
        </span>

        <ThemeWord text={jam.theme} />

        <p className="font-capriola text-(--blackberry)/80 text-center max-w-xl mt-6 text-sm sm:text-base">
          {upcoming
            ? 'We\u2019re putting together our first game jam. Stay tuned!'
            : active
            ? 'Make a game in 48 hours.'
            : 'See what the game devs were able to make on our itch.'}
        </p>

        {/* itch CTA — only show when active or past */}
        {!upcoming && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
            <a
              href={jam.itchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="jam-join-btn no-cursor block rounded-2xl px-8 py-5 text-center"
              style={{ background: 'linear-gradient(180deg, var(--ripe), #c9e04a)' }}
            >
              <span className="font-bebas text-2xl sm:text-3xl tracking-wide text-(--blackberry)">
                {active ? 'JOIN ON ITCH' : 'PLAY THE ENTRIES'}
              </span>
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bebas text-4xl sm:text-5xl leading-none text-(--pale) tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="font-cascadia text-[0.6rem] tracking-[0.2em] text-(--pale)/80 mt-1">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
   Timeline archive — selecting an edition swaps the hero
------------------------------------------------------------------- */

function Timeline({
  editions,
  selectedId,
  onSelect,
}: {
  editions: JamEdition[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="relative rounded-2xl mt-6 px-5 pt-14 pb-7 sm:px-8 shadow-2xl"
      style={{ background: 'linear-gradient(160deg, var(--blueberry), var(--grape))' }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide text-(--pale)">
          JAM TIMELINE
        </h3>
        <span className="font-cascadia text-xs text-(--pale)/70 hidden sm:block">
          tap an edition to relive it &rarr;
        </span>
      </div>

      <div className="jam-timeline-scroll flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
        {editions.map((jam, i) => {
          const selected = jam.id === selectedId;
          const isUpcomingCard = isUpcoming(jam);
          const isActiveCard = isActive(jam);
          return (
            <motion.button
              key={jam.id}
              type="button"
              onClick={() => onSelect(jam.id)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.34, 1.2, 0.64, 1] }}
              className={`jam-edition-card no-cursor shrink-0 w-44 text-left rounded-xl p-4 ring-2 ${
                selected ? 'ring-(--ripe)' : 'ring-transparent'
              }`}
              style={{ background: selected ? 'var(--pale)' : 'rgba(255,247,206,0.14)' }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bebas text-xl tracking-wide ${
                    selected ? 'text-(--blueberry)' : 'text-(--pale)'
                  }`}
                >
                  #{pad(jam.number)}
                </span>
                {isUpcomingCard ? (
                  <span className={`font-cascadia text-[0.6rem] uppercase tracking-widest ${selected ? 'text-(--grape)' : 'text-(--pale)/60'}`}>
                    soon
                  </span>
                ) : isActiveCard ? (
                  <span className="flex items-center gap-1">
                    <span className="jam-live-dot h-2 w-2 rounded-full bg-(--strawberry2)" />
                    <span className={`font-cascadia text-[0.6rem] uppercase tracking-widest ${selected ? 'text-(--strawberry1)' : 'text-(--strawberry3)'}`}>
                      live
                    </span>
                  </span>
                ) : (
                  <span className={`font-cascadia text-[0.6rem] uppercase tracking-widest ${selected ? 'text-(--blueberry)/60' : 'text-(--pale)/60'}`}>
                    done
                  </span>
                )}
              </div>

              <p className={`font-hiruko text-lg leading-tight mt-2 ${selected ? 'text-(--blackberry)' : 'text-(--pale)'}`}>
                {jam.theme}
              </p>

              <p className={`font-cascadia text-[0.7rem] mt-3 ${selected ? 'text-(--blueberry)/70' : 'text-(--pale)/70'}`}>
                {isUpcomingCard
                  ? 'Announcement coming'
                  : isActiveCard
                  ? `${jam.joined} joined`
                  : `${jam.stats!.submissions} games \u00b7 ${jam.stats!.participants} devs`}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */

function Jam() {
  const liveJam = EDITIONS.find(isActive) ?? EDITIONS.find(isUpcoming) ?? EDITIONS[0];
  const [selectedId, setSelectedId] = useState(liveJam.id);
  const selected = EDITIONS.find((j) => j.id === selectedId) ?? liveJam;

  return (
    <div className="relative z-10 w-full flex justify-center">
      <div className="w-full max-w-screen-4xl bg-(--verdant-faded) py-8 px-4 sm:px-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 w-full flex flex-col bg-white py-8 px-4 sm:px-8 shadow-2xl">

          {/* header */}
          <div className="flex flex-col items-center text-center mb-6">
            <span className="font-cascadia text-xs uppercase tracking-[0.35em] text-(--grape)">
              game dev club club presents
            </span>
            <h1 className="font-hiruko text-4xl sm:text-6xl text-(--blackberry) mt-2">
              GDCC JAM #{pad(selected.number)}
            </h1>
            <p className="font-capriola text-(--blueberry) mt-1">{selected.title}</p>
          </div>

          <Hero jam={selected} />

          <Timeline editions={EDITIONS} selectedId={selectedId} onSelect={setSelectedId} />

          <p className="font-cascadia text-xs sm:text-sm text-(--grape)/80 text-center mt-5 max-w-2xl mx-auto">
            Scroll the timeline to see all the game jams brought to you by GDCC.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Jam;