import { useState, useMemo } from 'react';

interface BeySlot {
  blade: string;
  ratchet: string;
  bit: string;
}

interface Blader {
  id: string;
  name: string;
  deck: [BeySlot, BeySlot, BeySlot];
  checkedIn: boolean;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pastOpponents: string[];
  hadBye: boolean;
}

// Popular Takara Tomy Competitive Parts Catalog for easy pickers
const BLADES = [
  'Phoenix Wing',
  'Wizard Rod',
  'Dran Buster',
  'Shark Edge',
  'Cobalt Dragoon',
  'Hells Chain',
  'Unicorn Sting',
  'Tyranno Beat',
  'Silver Wolf',
  'Aero Pegasus',
  'Knight Shield',
  'Ghost Circle',
  'Weiss Tiger',
  'Black Shell',
  'Leon Claw',
  'Dran Dagger',
  'Viper Tail',
  'Rhino Horn',
  'Wyvern Gale',
  'Knight Lance',
  'Sphinx Cowl',
  'Dran Sword',
  'Hells Scythe',
  'Chain Incendio',
];

const RATCHETS = [
  '1-60',
  '2-60',
  '3-60',
  '4-60',
  '5-60',
  '9-60',
  '3-70',
  '4-70',
  '9-70',
  '3-80',
  '4-80',
  '5-80',
  '0-80',
];
const BITS = [
  'Flat (F)',
  'Low Flat (LF)',
  'Gear Flat (GF)',
  'Ball (B)',
  'Orb (O)',
  'Hexa (H)',
  'Point (P)',
  'High Taper (HT)',
  'Accel (A)',
  'Cyclone (C)',
  'Quake (Q)',
  'Free Ball (FB)',
  'Glide (G)',
  'Unite (U)',
  'Dot (D)',
  'Needle (N)',
  'Gear Needle (GN)',
];

// Initial Roster from your tournament leaderboard
const INITIAL_NAMES = [
  'Khaled',
  'Rusab',
  'Samsul',
  'Azraf',
  'Didar',
  'Shakib',
  'Mymuna',
  'Ahnaf',
  'Joy',
  'Hrid',
  'Ayon',
  'Anadi',
  'Adib',
  'Tamim',
  'Mir Sakib',
  'Sayham',
  'Shohana',
  'Ayan Arabi',
  'Ehsan',
  'Rafin',
  'Zidan',
  'Salman',
  'Kento',
  'Rocche',
  'Challenger 25',
];

const makeDefaultDeck = (seed: number): [BeySlot, BeySlot, BeySlot] => [
  { blade: BLADES[seed % BLADES.length], ratchet: '9-60', bit: 'Ball (B)' },
  {
    blade: BLADES[(seed + 1) % BLADES.length],
    ratchet: '5-60',
    bit: 'Point (P)',
  },
  {
    blade: BLADES[(seed + 2) % BLADES.length],
    ratchet: '3-60',
    bit: 'Low Flat (LF)',
  },
];

export default function App() {
  const [bladers, setBladers] = useState<Blader[]>(() =>
    INITIAL_NAMES.map((name, i) => ({
      id: `p-${i + 1}`,
      name,
      deck: makeDefaultDeck(i),
      checkedIn: true,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pastOpponents: [],
      hadBye: false,
    }))
  );

  const [activeTab, setActiveTab] = useState<
    'roster' | 'pairings' | 'standings' | 'topcut'
  >('roster');
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState<any>({});
  const [activeMatchModal, setActiveMatchModal] = useState<any>(null);
  const [editingBlader, setEditingBlader] = useState<Blader | null>(null);
  const [newBladerName, setNewBladerName] = useState('');
  const [] = useState(false);
  const [topCutMatches, setTopCutMatches] = useState<any>(null);

  // Validation function: Check Takara Tomy No-Repeat Rule across the 3 deck slots
  const getDeckErrors = (deck: [BeySlot, BeySlot, BeySlot]) => {
    const errors: string[] = [];
    const blades = [deck[0].blade, deck[1].blade, deck[2].blade].filter(
      Boolean
    );
    const ratchets = [deck[0].ratchet, deck[1].ratchet, deck[2].ratchet].filter(
      Boolean
    );
    const bits = [deck[0].bit, deck[1].bit, deck[2].bit].filter(Boolean);

    if (new Set(blades).size !== blades.length)
      errors.push('Duplicate Blade detected! No repeats allowed.');
    if (new Set(ratchets).size !== ratchets.length)
      errors.push('Duplicate Ratchet detected! No repeats allowed.');
    if (new Set(bits).size !== bits.length)
      errors.push('Duplicate Bit detected! No repeats allowed.');

    return errors;
  };

  // Swiss Pairings Generator (uses only checkedIn players)
  const generateSwissPairings = (pool: Blader[], roundNumber: number) => {
    const active = pool.filter((b) => b.checkedIn);
    if (active.length < 2) {
      alert('At least 2 bladers must be checked in to start the tournament!');
      return [];
    }

    const sorted = [...active].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const diffB = b.pointsFor - b.pointsAgainst;
      const diffA = a.pointsFor - a.pointsAgainst;
      return diffB - diffA;
    });

    const pairings: any[] = [];
    const assigned = new Set<string>();

    let byeBlader: Blader | null = null;
    if (sorted.length % 2 !== 0) {
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (!sorted[i].hadBye) {
          byeBlader = sorted[i];
          assigned.add(byeBlader.id);
          break;
        }
      }
      if (!byeBlader) {
        byeBlader = sorted[sorted.length - 1];
        assigned.add(byeBlader.id);
      }
    }

    const havePlayed = (id1: string, id2: string) => {
      const p1 = pool.find((b) => b.id === id1);
      return p1?.pastOpponents?.includes(id2) || false;
    };

    for (let i = 0; i < sorted.length; i++) {
      const p1 = sorted[i];
      if (assigned.has(p1.id)) continue;

      let opponent: Blader | null = null;
      for (let j = i + 1; j < sorted.length; j++) {
        const p2 = sorted[j];
        if (!assigned.has(p2.id) && !havePlayed(p1.id, p2.id)) {
          opponent = p2;
          break;
        }
      }

      if (!opponent) {
        for (let j = i + 1; j < sorted.length; j++) {
          const p2 = sorted[j];
          if (!assigned.has(p2.id)) {
            opponent = p2;
            break;
          }
        }
      }

      if (opponent) {
        assigned.add(p1.id);
        assigned.add(opponent.id);
        pairings.push({
          id: `m_r${roundNumber}_${pairings.length + 1}`,
          stadium: pairings.length + 1,
          p1Id: p1.id,
          p2Id: opponent.id,
          p1Score: 0,
          p2Score: 0,
          p1Fouls: 0,
          p2Fouls: 0,
          status: 'pending',
          winnerId: null,
          history: [] as any[],
        });
      }
    }

    if (byeBlader) {
      pairings.push({
        id: `m_r${roundNumber}_bye`,
        stadium: 'BYE',
        p1Id: byeBlader.id,
        p2Id: null,
        p1Score: 4,
        p2Score: 0,
        p1Fouls: 0,
        p2Fouls: 0,
        status: 'finished',
        winnerId: byeBlader.id,
        history: [{ type: 'Automatic Bye (+4 PTS)', pts: 4, player: 1 }],
      });
    }

    return pairings;
  };

  const handleStartTournament = () => {
    const checkedCount = bladers.filter((b) => b.checkedIn).length;
    if (checkedCount < 2) {
      alert('Please check in at least 2 bladers before generating Round 1.');
      return;
    }
    const r1 = generateSwissPairings(bladers, 1);
    setRounds({ 1: r1 });
    setCurrentRound(1);
    setActiveTab('pairings');
  };

  const standings = useMemo(() => {
    return [...bladers]
      .filter((b) => b.checkedIn)
      .map((blader) => {
        const buchholz = (blader.pastOpponents || []).reduce(
          (acc: number, oppId: string) => {
            const opp = bladers.find((b) => b.id === oppId);
            return acc + (opp ? opp.wins : 0);
          },
          0
        );
        return {
          ...blader,
          pointDiff: blader.pointsFor - blader.pointsAgainst,
          buchholz,
        };
      })
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
        return b.pointDiff - a.pointDiff;
      });
  }, [bladers]);

  // Scoring
  const handleApplyFinish = (
    playerNum: 1 | 2,
    finishType: string,
    points: number
  ) => {
    if (!activeMatchModal || activeMatchModal.winnerId) return;
    const cur = { ...activeMatchModal };
    const newP1 = playerNum === 1 ? cur.p1Score + points : cur.p1Score;
    const newP2 = playerNum === 2 ? cur.p2Score + points : cur.p2Score;

    cur.history.push({
      type: `${finishType} (+${points})`,
      pts: points,
      player: playerNum,
    });
    cur.p1Score = newP1;
    cur.p2Score = newP2;
    cur.status = 'live';

    if (newP1 >= 4) {
      cur.winnerId = cur.p1Id;
      cur.status = 'finished';
    } else if (newP2 >= 4) {
      cur.winnerId = cur.p2Id;
      cur.status = 'finished';
    }
    setActiveMatchModal(cur);
  };

  const handleFoul = (playerNum: 1 | 2) => {
    if (!activeMatchModal || activeMatchModal.winnerId) return;
    const cur = { ...activeMatchModal };
    if (playerNum === 1) {
      cur.p1Fouls += 1;
      if (cur.p1Fouls % 2 === 0) {
        cur.p2Score += 1;
        cur.history.push({
          type: '2 Fouls Penalty -> P2 (+1 PT)',
          pts: 1,
          player: 2,
        });
        if (cur.p2Score >= 4) {
          cur.winnerId = cur.p2Id;
          cur.status = 'finished';
        }
      }
    } else {
      cur.p2Fouls += 1;
      if (cur.p2Fouls % 2 === 0) {
        cur.p1Score += 1;
        cur.history.push({
          type: '2 Fouls Penalty -> P1 (+1 PT)',
          pts: 1,
          player: 1,
        });
        if (cur.p1Score >= 4) {
          cur.winnerId = cur.p1Id;
          cur.status = 'finished';
        }
      }
    }
    setActiveMatchModal(cur);
  };

  const handleSaveMatchScore = () => {
    if (!activeMatchModal) return;
    setRounds((prev: any) => {
      const matchArr = [...(prev[currentRound] || [])];
      const idx = matchArr.findIndex((m: any) => m.id === activeMatchModal.id);
      if (idx !== -1) matchArr[idx] = activeMatchModal;
      return { ...prev, [currentRound]: matchArr };
    });

    if (activeMatchModal.status === 'finished') {
      const { p1Id, p2Id, p1Score, p2Score, winnerId } = activeMatchModal;
      setBladers((prev) =>
        prev.map((b) => {
          if (b.id === p1Id) {
            const isWin = winnerId === p1Id;
            return {
              ...b,
              wins: b.wins + (isWin ? 1 : 0),
              losses: b.losses + (isWin ? 0 : 1),
              pointsFor: b.pointsFor + p1Score,
              pointsAgainst: b.pointsAgainst + p2Score,
              pastOpponents: p2Id
                ? [...b.pastOpponents, p2Id]
                : b.pastOpponents,
              hadBye: p2Id === null ? true : b.hadBye,
            };
          }
          if (b.id === p2Id) {
            const isWin = winnerId === p2Id;
            return {
              ...b,
              wins: b.wins + (isWin ? 1 : 0),
              losses: b.losses + (isWin ? 0 : 1),
              pointsFor: b.pointsFor + p2Score,
              pointsAgainst: b.pointsAgainst + p1Score,
              pastOpponents: [...b.pastOpponents, p1Id],
            };
          }
          return b;
        })
      );
    }
    setActiveMatchModal(null);
  };

  const handleNextRound = () => {
    const currentMatches = rounds[currentRound] || [];
    const allDone = currentMatches.every((m: any) => m.status === 'finished');
    if (!allDone) {
      alert(
        'Please complete all active arena matches before moving to the next round!'
      );
      return;
    }

    const nextR = currentRound + 1;
    if (nextR > 5) {
      generateTopCut();
      setActiveTab('topcut');
      return;
    }
    const nextPairings = generateSwissPairings(bladers, nextR);
    setRounds((prev: any) => ({ ...prev, [nextR]: nextPairings }));
    setCurrentRound(nextR);
  };

  const generateTopCut = () => {
    const qualified = standings.slice(0, 4);
    if (qualified.length < 4) return;
    setTopCutMatches({
      semi1: {
        title: 'Semi-Final 1 (Seed 1 vs 4)',
        p1: qualified[0],
        p2: qualified[3],
        p1Score: 0,
        p2Score: 0,
        winner: null,
        status: 'pending',
      },
      semi2: {
        title: 'Semi-Final 2 (Seed 2 vs 3)',
        p1: qualified[1],
        p2: qualified[2],
        p1Score: 0,
        p2Score: 0,
        winner: null,
        status: 'pending',
      },
      final: {
        title: 'Grand Championship Match',
        p1: null,
        p2: null,
        p1Score: 0,
        p2Score: 0,
        winner: null,
        status: 'waiting',
      },
    });
  };

  const activeMatches = rounds[currentRound] || [];
  const currentRoundFinished =
    activeMatches.length > 0 &&
    activeMatches.every((m: any) => m.status === 'finished');
  const checkedInCount = bladers.filter((b) => b.checkedIn).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0b101f]/95 backdrop-blur border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff4500] to-cyan-400 p-[2px] flex items-center justify-center font-black text-black">
            <span className="text-xs bg-[#0a0f1d] text-cyan-400 w-full h-full rounded-[10px] flex items-center justify-center">
              X
            </span>
          </div>
          <div>
            <h1 className="text-base font-black italic tracking-wider text-white">
              BEYBLADE X{' '}
              <span className="text-amber-400 text-[10px] border border-amber-400/80 px-1 py-0.5 rounded ml-1">
                REGISTRATION & ARENA
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {checkedInCount} of {bladers.length} Bladers Playing &bull; Round{' '}
              {currentRound}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'roster'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 1. Register & Decks ({checkedInCount})
          </button>
          <button
            onClick={() => setActiveTab('pairings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'pairings'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚔️ 2. Arena Matches
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'standings'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎖️ 3. Standings
          </button>
          <button
            onClick={() => setActiveTab('topcut')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'topcut'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 Top 4 Cut
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* TAB 1: REGISTRATION, ROSTER & 3-ON-3 BEY DECK CHECK */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Blader Registration & Bey Deck Check
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check-in the players who are physically present for this
                  tournament. Click <strong>"Edit 3v3 Deck"</strong> to register
                  their official combos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allChecked = bladers.every((b) => b.checkedIn);
                    setBladers((prev) =>
                      prev.map((b) => ({ ...b, checkedIn: !allChecked }))
                    );
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  {bladers.every((b) => b.checkedIn)
                    ? 'Uncheck All'
                    : 'Select All 25'}
                </button>
                <button
                  onClick={handleStartTournament}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-5 py-2 rounded-xl uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  ⚡ Confirm Lineup & Generate R1
                </button>
              </div>
            </div>

            {/* Quick Add Custom Player */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBladerName}
                onChange={(e) => setNewBladerName(e.target.value)}
                placeholder="Register new blader name..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-cyan-400 text-slate-200"
              />
              <button
                onClick={() => {
                  if (!newBladerName.trim()) return;
                  const newB: Blader = {
                    id: `p-${Date.now()}`,
                    name: newBladerName.trim(),
                    deck: makeDefaultDeck(bladers.length),
                    checkedIn: true,
                    wins: 0,
                    losses: 0,
                    pointsFor: 0,
                    pointsAgainst: 0,
                    pastOpponents: [],
                    hadBye: false,
                  };
                  setBladers((prev) => [...prev, newB]);
                  setNewBladerName('');
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs"
              >
                + Register Blader
              </button>
            </div>

            {/* Bladers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bladers.map((b, idx) => {
                const deckErrors = getDeckErrors(b.deck);
                const hasError = deckErrors.length > 0;

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      b.checkedIn
                        ? 'bg-slate-900/90 border-slate-800 shadow-md'
                        : 'bg-slate-950/40 border-slate-900 opacity-40'
                    }`}
                  >
                    <div>
                      {/* Blader Header & Checkbox */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-xs">
                            #{idx + 1}
                          </span>
                          <span className="font-black text-sm text-white">
                            {b.name}
                          </span>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                          <span>{b.checkedIn ? 'Playing' : 'Bench'}</span>
                          <input
                            type="checkbox"
                            checked={b.checkedIn}
                            onChange={() =>
                              setBladers((prev) =>
                                prev.map((p) =>
                                  p.id === b.id
                                    ? { ...p, checkedIn: !p.checkedIn }
                                    : p
                                )
                              )
                            }
                            className="accent-cyan-400 w-4 h-4 cursor-pointer rounded"
                          />
                        </label>
                      </div>

                      {/* 3-on-3 Deck Summary */}
                      <div className="space-y-1.5 mb-3 font-mono text-[11px]">
                        {b.deck.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex items-center justify-between"
                          >
                            <span className="text-slate-400 font-bold">
                              Bey {sIdx + 1}:
                            </span>
                            <span className="text-cyan-300 truncate font-semibold ml-2">
                              {slot.blade}{' '}
                              <span className="text-slate-400">
                                {slot.ratchet} {slot.bit}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {hasError && (
                        <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[10px] p-2 rounded-lg mb-3">
                          ⚠️ {deckErrors[0]}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingBlader(b)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      ✏️ Edit 3v3 Deck & Inspection
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ARENA MATCHES & SCORING */}
        {activeTab === 'pairings' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400">
                  R{currentRound}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Swiss Round {currentRound} of 5
                    {currentRoundFinished && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ✓ Round Ready
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    First to 4 points. Tap any arena match to open referee score
                    controls.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentRoundFinished && currentRound < 5 && (
                  <button
                    onClick={handleNextRound}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider animate-pulse"
                  >
                    Pair Round {currentRound + 1} ➔
                  </button>
                )}
                {currentRound === 5 && currentRoundFinished && (
                  <button
                    onClick={() => {
                      generateTopCut();
                      setActiveTab('topcut');
                    }}
                    className="bg-gradient-to-r from-[#ff4500] to-amber-500 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider"
                  >
                    🏆 Launch Top 4 Championship
                  </button>
                )}
              </div>
            </div>

            {activeMatches.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <p className="text-slate-400 text-sm mb-4">
                  No active matches paired yet.
                </p>
                <button
                  onClick={handleStartTournament}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase"
                >
                  Generate Round 1 Pairings
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMatches.map((m: any) => {
                  const p1 = bladers.find((b) => b.id === m.p1Id);
                  const p2 = bladers.find((b) => b.id === m.p2Id);
                  const isBye = m.stadium === 'BYE';
                  const isFinished = m.status === 'finished';

                  return (
                    <div
                      key={m.id}
                      onClick={() =>
                        !isBye &&
                        setActiveMatchModal(JSON.parse(JSON.stringify(m)))
                      }
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isBye
                          ? 'bg-slate-900/40 border-slate-800 cursor-default opacity-75'
                          : isFinished
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-slate-900 border-cyan-900/60 hover:border-cyan-400 shadow-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-cyan-400">
                          {isBye
                            ? 'Automatic Bye'
                            : `Table / Stadium ${m.stadium}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isFinished
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-[#ff4500]/20 text-[#ff7744]'
                          }`}
                        >
                          {isBye
                            ? 'Free Pass (+4)'
                            : isFinished
                            ? 'Finished'
                            : 'Live Battle'}
                        </span>
                      </div>

                      {/* Opponents */}
                      <div className="space-y-3">
                        {/* Player 1 */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-bold text-sm ${
                                m.winnerId === p1?.id
                                  ? 'text-cyan-300 font-black'
                                  : 'text-slate-200'
                              }`}
                            >
                              {p1?.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {p1?.deck[0].blade} ({p1?.deck[0].ratchet}{' '}
                              {p1?.deck[0].bit})
                            </div>
                          </div>
                          <span className="text-xl font-black text-cyan-400">
                            {m.p1Score}
                          </span>
                        </div>

                        <div className="text-center text-[10px] text-slate-600 font-bold uppercase">
                          VS
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-bold text-sm ${
                                m.winnerId === p2?.id
                                  ? 'text-cyan-300 font-black'
                                  : 'text-slate-200'
                              }`}
                            >
                              {isBye ? 'No Opponent (Bye Round)' : p2?.name}
                            </div>
                            {!isBye && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {p2?.deck[0].blade} ({p2?.deck[0].ratchet}{' '}
                                {p2?.deck[0].bit})
                              </div>
                            )}
                          </div>
                          <span className="text-xl font-black text-cyan-400">
                            {m.p2Score}
                          </span>
                        </div>
                      </div>

                      {!isBye && (
                        <div className="mt-4 pt-2 border-t border-slate-800/80 text-center">
                          <span className="text-[11px] font-bold text-slate-400 hover:text-cyan-300">
                            {isFinished
                              ? 'Review / Edit Match Score'
                              : '▶ Tap to Score Match'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STANDINGS & BUCHHOLZ TIEBREAKERS */}
        {activeTab === 'standings' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#090d18] shadow-2xl">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Blader</th>
                  <th className="p-3">Primary Bey Combo</th>
                  <th className="p-3 text-center">W - L</th>
                  <th className="p-3 text-center">Pts Diff</th>
                  <th className="p-3 text-center">Total Score</th>
                  <th className="p-3 text-center">Buchholz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {standings.map((b, idx) => (
                  <tr key={b.id} className={idx < 4 ? 'bg-cyan-950/20' : ''}>
                    <td className="p-3 text-center font-bold text-cyan-400">
                      #{idx + 1}
                    </td>
                    <td className="p-3 font-sans font-bold text-slate-100 flex items-center gap-1.5">
                      {b.name}
                      {idx < 4 && (
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 rounded-sm">
                          TOP 4
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-400 font-sans">
                      {b.deck[0].blade} {b.deck[0].ratchet} {b.deck[0].bit}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-200">
                      {b.wins} - {b.losses}
                    </td>
                    <td className="p-3 text-center text-slate-300">
                      {b.pointDiff > 0 ? `+${b.pointDiff}` : b.pointDiff}
                    </td>
                    <td className="p-3 text-center text-cyan-300">
                      {b.pointsFor}
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      {b.buchholz}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: TOP 4 CUT FINALS */}
        {activeTab === 'topcut' && (
          <div className="space-y-6">
            {!topCutMatches ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="text-base font-bold text-white mb-2">
                  Top 4 Single-Elimination Bracket
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Run through Swiss rounds to seed the top 4 competitors, or
                  generate early if ready.
                </p>
                <button
                  onClick={generateTopCut}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase"
                >
                  Seed Top 4 from Standings
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Semi 1 */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    {topCutMatches.semi1.title}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold text-xs">
                      <span>{topCutMatches.semi1.p1.name} (Seed 1)</span>
                      <span>{topCutMatches.semi1.p1Score}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold text-xs">
                      <span>{topCutMatches.semi1.p2.name} (Seed 4)</span>
                      <span>{topCutMatches.semi1.p2Score}</span>
                    </div>
                  </div>
                </div>

                {/* Semi 2 */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    {topCutMatches.semi2.title}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold text-xs">
                      <span>{topCutMatches.semi2.p1.name} (Seed 2)</span>
                      <span>{topCutMatches.semi2.p1Score}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold text-xs">
                      <span>{topCutMatches.semi2.p2.name} (Seed 3)</span>
                      <span>{topCutMatches.semi2.p2Score}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3-ON-3 DECK REGISTRATION & INSPECTION MODAL */}
      {editingBlader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0d1322] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black italic text-cyan-400 uppercase">
                  3-on-3 Deck Check &bull; {editingBlader.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Takara Tomy Official Rule: No duplicate Blades, Ratchets, or
                  Bits.
                </p>
              </div>
              <button
                onClick={() => setEditingBlader(null)}
                className="text-slate-400 hover:text-white font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Rename Blader Option */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Blader Tag / Handle
              </label>
              <input
                type="text"
                value={editingBlader.name}
                onChange={(e) =>
                  setEditingBlader({ ...editingBlader, name: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
              />
            </div>

            {/* 3 Slot Builders */}
            {[0, 1, 2].map((slotIdx) => (
              <div
                key={slotIdx}
                className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5"
              >
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Slot #{slotIdx + 1} Beyblade</span>
                  <span className="text-[10px] text-slate-500">
                    Order cannot change mid-match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Blade */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Blade
                    </span>
                    <select
                      value={editingBlader.deck[slotIdx].blade}
                      onChange={(e) => {
                        const newDeck = [...editingBlader.deck] as [
                          BeySlot,
                          BeySlot,
                          BeySlot
                        ];
                        newDeck[slotIdx].blade = e.target.value;
                        setEditingBlader({ ...editingBlader, deck: newDeck });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-400"
                    >
                      {BLADES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ratchet */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Ratchet
                    </span>
                    <select
                      value={editingBlader.deck[slotIdx].ratchet}
                      onChange={(e) => {
                        const newDeck = [...editingBlader.deck] as [
                          BeySlot,
                          BeySlot,
                          BeySlot
                        ];
                        newDeck[slotIdx].ratchet = e.target.value;
                        setEditingBlader({ ...editingBlader, deck: newDeck });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-400"
                    >
                      {RATCHETS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bit */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Bit
                    </span>
                    <select
                      value={editingBlader.deck[slotIdx].bit}
                      onChange={(e) => {
                        const newDeck = [...editingBlader.deck] as [
                          BeySlot,
                          BeySlot,
                          BeySlot
                        ];
                        newDeck[slotIdx].bit = e.target.value;
                        setEditingBlader({ ...editingBlader, deck: newDeck });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-400"
                    >
                      {BITS.map((bit) => (
                        <option key={bit} value={bit}>
                          {bit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Validation Feedback */}
            {getDeckErrors(editingBlader.deck).length > 0 ? (
              <div className="bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl">
                <strong>Illegal Deck Composition:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {getDeckErrors(editingBlader.deck).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs p-2.5 rounded-xl font-bold flex items-center gap-1.5">
                <span>✓</span> Deck passed Bey Check inspection (No repeats
                detected).
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingBlader(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBladers((prev) =>
                    prev.map((p) =>
                      p.id === editingBlader.id ? editingBlader : p
                    )
                  );
                  setEditingBlader(null);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 uppercase tracking-wider"
              >
                Save Deck & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFEREE SCORING MODAL */}
      {activeMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0d1322] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Stadium {activeMatchModal.stadium} &bull; Referee Console
                </h3>
                <p className="text-[11px] text-slate-400">
                  First to 4 points (Spin 1pt, Over 2pts, Burst 2pts, Xtreme
                  3pts)
                </p>
              </div>
              <button
                onClick={() => setActiveMatchModal(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* P1 */}
              {(() => {
                const p1 = bladers.find((b) => b.id === activeMatchModal.p1Id);
                return (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <div className="text-sm font-black text-white truncate">
                      {p1?.name}
                    </div>
                    <div className="text-[11px] text-cyan-400 truncate mb-2">
                      {p1?.deck[0].blade}
                    </div>
                    <div className="text-5xl font-black text-white mb-2">
                      {activeMatchModal.p1Score}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3">
                      Fouls: {activeMatchModal.p1Fouls}/2
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      <button
                        onClick={() => handleApplyFinish(1, 'Spin', 1)}
                        className="bg-slate-800 py-2 rounded-lg"
                      >
                        +1 Spin
                      </button>
                      <button
                        onClick={() => handleApplyFinish(1, 'Over', 2)}
                        className="bg-cyan-950 text-cyan-300 py-2 rounded-lg border border-cyan-700"
                      >
                        +2 Over
                      </button>
                      <button
                        onClick={() => handleApplyFinish(1, 'Burst', 2)}
                        className="bg-blue-950 text-blue-300 py-2 rounded-lg border border-blue-700"
                      >
                        +2 Burst
                      </button>
                      <button
                        onClick={() => handleApplyFinish(1, 'Xtreme', 3)}
                        className="bg-amber-950 text-amber-300 py-2 rounded-lg border border-amber-600"
                      >
                        +3 Xtreme
                      </button>
                    </div>
                    <button
                      onClick={() => handleFoul(1)}
                      className="w-full mt-2 py-1 text-[10px] text-rose-400 border border-rose-500/20 rounded"
                    >
                      +1 Foul (False Launch)
                    </button>
                  </div>
                );
              })()}

              {/* P2 */}
              {(() => {
                const p2 = bladers.find((b) => b.id === activeMatchModal.p2Id);
                return (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <div className="text-sm font-black text-white truncate">
                      {p2?.name}
                    </div>
                    <div className="text-[11px] text-cyan-400 truncate mb-2">
                      {p2?.deck[0].blade}
                    </div>
                    <div className="text-5xl font-black text-white mb-2">
                      {activeMatchModal.p2Score}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3">
                      Fouls: {activeMatchModal.p2Fouls}/2
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      <button
                        onClick={() => handleApplyFinish(2, 'Spin', 1)}
                        className="bg-slate-800 py-2 rounded-lg"
                      >
                        +1 Spin
                      </button>
                      <button
                        onClick={() => handleApplyFinish(2, 'Over', 2)}
                        className="bg-cyan-950 text-cyan-300 py-2 rounded-lg border border-cyan-700"
                      >
                        +2 Over
                      </button>
                      <button
                        onClick={() => handleApplyFinish(2, 'Burst', 2)}
                        className="bg-blue-950 text-blue-300 py-2 rounded-lg border border-blue-700"
                      >
                        +2 Burst
                      </button>
                      <button
                        onClick={() => handleApplyFinish(2, 'Xtreme', 3)}
                        className="bg-amber-950 text-amber-300 py-2 rounded-lg border border-amber-600"
                      >
                        +3 Xtreme
                      </button>
                    </div>
                    <button
                      onClick={() => handleFoul(2)}
                      className="w-full mt-2 py-1 text-[10px] text-rose-400 border border-rose-500/20 rounded"
                    >
                      +1 Foul (False Launch)
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setActiveMatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatchScore}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 uppercase"
              >
                Confirm Match Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
