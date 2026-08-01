'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface Team {
  name: string;
  members: string[];
}

export default function TeamRandomizer() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Add member
  const addMember = () => {
    if (newMember.trim() && members.length < 100) {
      setMembers([...members, newMember.trim()]);
      setNewMember('');
    }
  };

  // Remove member
  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  // Bulk add members
  const handleBulkAdd = () => {
    const names = bulkInput
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length > 0) {
      setMembers(names.slice(0, 100));
      setBulkInput('');
      setShowBulkInput(false);
    }
  };

  // Shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Randomize teams
  const randomizeTeams = async () => {
    if (members.length < teamCount) return;

    setIsAnimating(true);
    setTeams([]);

    // Animation effect
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const shuffled = shuffleArray(members);
      const tempTeams: Team[] = Array(teamCount).fill(null).map((_, idx) => ({
        name: `${t({ en: 'Team', pt: 'Team' })} ${idx + 1}`,
        members: [],
      }));

      shuffled.forEach((member, idx) => {
        tempTeams[idx % teamCount].members.push(member);
      });

      setTeams(tempTeams);
    }

    // Final shuffle
    const shuffled = shuffleArray(members);
    const finalTeams: Team[] = Array(teamCount).fill(null).map((_, idx) => ({
      name: `${t({ en: 'Team', pt: 'Team' })} ${idx + 1}`,
      members: [],
    }));

    shuffled.forEach((member, idx) => {
      finalTeams[idx % teamCount].members.push(member);
    });

    setTeams(finalTeams);
    setIsAnimating(false);
  };

  // Clear all
  const clearAll = () => {
    setMembers([]);
    setTeams([]);
  };

  // Team colors
  const teamColors = [
    'from-red-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-purple-500 to-violet-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
    'from-rose-500 to-red-500',
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto px-4">
      {/* Input Section */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Member Input */}
        <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">
              {t({ en: 'Participants', pt: 'Participants' })} ({members.length})
            </h3>
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="text-sm text-primary-500 hover:underline"
            >
              {t({ en: 'Bulk Input', pt: 'Bulk Input' })}
            </button>
          </div>

          {showBulkInput ? (
            <div className="space-y-2">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={t({ en: 'Enter names separated by newlines or commas\n(max 100)', pt: 'Enter names separated by newlines or commas\n(max 100)' })}
                className="w-full h-40 p-3 text-sm border border-[var(--color-border)] rounded-lg resize-none bg-[var(--color-bg)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBulkAdd}
                  className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  {t({ en: 'Apply', pt: 'Apply' })}
                </button>
                <button
                  onClick={() => setShowBulkInput(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)]"
                >
                  {t({ en: 'Cancel', pt: 'Cancel' })}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMember()}
                  placeholder={t({ en: 'Enter name', pt: 'Enter name' })}
                  className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]"
                  maxLength={30}
                />
                <button
                  onClick={addMember}
                  disabled={members.length >= 100}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {t({ en: 'Add', pt: 'Add' })}
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[var(--color-bg)] rounded-lg text-sm"
                  >
                    <span className="truncate">{member}</span>
                    <button
                      onClick={() => removeMember(idx)}
                      className="text-red-500 hover:text-red-600 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {members.length > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-2 text-sm text-red-500 hover:underline"
                >
                  {t({ en: 'Clear All', pt: 'Clear All' })}
                </button>
              )}
            </>
          )}
        </div>

        {/* Team Count */}
        <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <h3 className="font-bold mb-3">
            {t({ en: 'Number of Teams', pt: 'Number of Teams' })}
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTeamCount(Math.max(2, teamCount - 1))}
              className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]"
            >
              -
            </button>
            <span className="text-3xl font-bold w-12 text-center">{teamCount}</span>
            <button
              onClick={() => setTeamCount(Math.min(8, teamCount + 1))}
              className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]"
            >
              +
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {t({ en: '2-8 teams', pt: '2-8 teams' })}
          </p>
        </div>

        {/* Randomize Button */}
        <button
          onClick={randomizeTeams}
          disabled={members.length < teamCount || isAnimating}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-xl font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAnimating
            ? t({ en: 'Shuffling...', pt: 'Shuffling...' })
            : t({ en: '🎲 Split Teams!', pt: '🎲 Split Teams!' })}
        </button>

        {members.length > 0 && members.length < teamCount && (
          <p className="text-sm text-red-500 text-center">
            {t({ en: `Need at least ${teamCount} participants`, pt: `Need at least ${teamCount} participants` })}
          </p>
        )}
      </div>

      {/* Results Section */}
      <div className="flex-1">
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl bg-gradient-to-br ${teamColors[idx % teamColors.length]} text-white ${
                  isAnimating ? 'animate-pulse' : ''
                }`}
              >
                <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {team.name}
                  <span className="text-sm font-normal opacity-75">
                    ({team.members.length})
                  </span>
                </h4>
                <div className="space-y-1">
                  {team.members.map((member, memberIdx) => (
                    <div
                      key={memberIdx}
                      className="px-3 py-2 bg-white/20 rounded-lg text-sm backdrop-blur-sm"
                    >
                      {member}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="text-center">
              <div className="text-6xl mb-4">👥</div>
              <p>
                {t({ en: 'Add participants and split into teams', pt: 'Add participants and split into teams' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
