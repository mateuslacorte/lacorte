'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface Participant {
  id: string;
  name: string;
}

interface Result {
  id: string;
  name: string;
}

export default function LadderGame() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Participant 1' },
    { id: '2', name: 'Participant 2' },
    { id: '3', name: 'Participant 3' },
    { id: '4', name: 'Participant 4' },
  ]);
  const [results, setResults] = useState<Result[]>([
    { id: '1', name: 'Winner!' },
    { id: '2', name: 'Lose' },
    { id: '3', name: 'Lose' },
    { id: '4', name: 'Lose' },
  ]);
  const [newParticipant, setNewParticipant] = useState('');
  const [newResult, setNewResult] = useState('');
  const [ladderData, setLadderData] = useState<number[][]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<{ participant: string; result: string } | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Generate ladder
  const generateLadder = () => {
    const count = participants.length;
    const rows = 10;
    const newLadder: number[][] = [];

    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < count - 1; j++) {
        // Random horizontal connection (30% chance)
        row.push(Math.random() < 0.3 ? 1 : 0);
      }
      newLadder.push(row);
    }

    setLadderData(newLadder);
    setSelectedIndex(null);
    setFinalResult(null);
  };

  // Draw ladder
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ladderData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = participants.length;
    const width = canvas.width;
    const height = canvas.height;
    const colWidth = width / count;
    const rowHeight = height / (ladderData.length + 1);

    // Clear
    // Canvas doesn't understand CSS variables in all browsers, so resolve it to a real color.
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg')
      .trim();
    ctx.fillStyle = bg || '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw vertical lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    for (let i = 0; i < count; i++) {
      const x = colWidth / 2 + i * colWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ladderData.forEach((row, rowIdx) => {
      const y = rowHeight * (rowIdx + 1);
      row.forEach((hasLine, colIdx) => {
        if (hasLine) {
          const x1 = colWidth / 2 + colIdx * colWidth;
          const x2 = colWidth / 2 + (colIdx + 1) * colWidth;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      });
    });
  }, [ladderData, participants.length]);

  // Animate path
  const animatePath = async (startIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || ladderData.length === 0) return;

    setIsAnimating(true);
    setSelectedIndex(startIndex);
    setFinalResult(null);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = participants.length;
    const width = canvas.width;
    const height = canvas.height;
    const colWidth = width / count;
    const rowHeight = height / (ladderData.length + 1);

    let currentCol = startIndex;
    let currentY = 0;

    // Draw starting point
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(colWidth / 2 + currentCol * colWidth, 10, 8, 0, Math.PI * 2);
    ctx.stroke();

    for (let rowIdx = 0; rowIdx < ladderData.length; rowIdx++) {
      const nextY = rowHeight * (rowIdx + 1);
      const x = colWidth / 2 + currentCol * colWidth;

      // Draw vertical part
      await new Promise(resolve => setTimeout(resolve, 100));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, currentY);
      ctx.lineTo(x, nextY);
      ctx.stroke();

      currentY = nextY;

      // Check for horizontal line
      const row = ladderData[rowIdx];

      // Check left
      if (currentCol > 0 && row[currentCol - 1]) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const x1 = colWidth / 2 + currentCol * colWidth;
        const x2 = colWidth / 2 + (currentCol - 1) * colWidth;
        ctx.beginPath();
        ctx.moveTo(x1, currentY);
        ctx.lineTo(x2, currentY);
        ctx.stroke();
        currentCol--;
      }
      // Check right
      else if (currentCol < count - 1 && row[currentCol]) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const x1 = colWidth / 2 + currentCol * colWidth;
        const x2 = colWidth / 2 + (currentCol + 1) * colWidth;
        ctx.beginPath();
        ctx.moveTo(x1, currentY);
        ctx.lineTo(x2, currentY);
        ctx.stroke();
        currentCol++;
      }
    }

    // Draw to bottom
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalX = colWidth / 2 + currentCol * colWidth;
    ctx.beginPath();
    ctx.moveTo(finalX, currentY);
    ctx.lineTo(finalX, height);
    ctx.stroke();

    // Show result
    setFinalResult({
      participant: participants[startIndex].name,
      result: results[currentCol]?.name || '?',
    });
    setIsAnimating(false);
  };

  // Add participant
  const addParticipant = () => {
    if (newParticipant.trim() && participants.length < 10) {
      setParticipants([
        ...participants,
        { id: Date.now().toString(), name: newParticipant.trim() },
      ]);
      setNewParticipant('');
      setLadderData([]);
    }
  };

  // Add result
  const addResult = () => {
    if (newResult.trim() && results.length < 10) {
      setResults([
        ...results,
        { id: Date.now().toString(), name: newResult.trim() },
      ]);
      setNewResult('');
    }
  };

  // Remove participant
  const removeParticipant = (id: string) => {
    if (participants.length > 2) {
      setParticipants(participants.filter(p => p.id !== id));
      setLadderData([]);
    }
  };

  // Remove result
  const removeResult = (id: string) => {
    if (results.length > 2) {
      setResults(results.filter(r => r.id !== id));
    }
  };

  // Bulk add participants
  const handleBulkAdd = () => {
    const names = bulkInput
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length > 0) {
      const newParticipants = names.slice(0, 10).map((name, idx) => ({
        id: `bulk-${Date.now()}-${idx}`,
        name,
      }));
      setParticipants(newParticipants);
      setBulkInput('');
      setShowBulkInput(false);
      setLadderData([]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto px-4 min-w-0">
      {/* Ladder Display */}
      <div className="flex-1">
        {/* Participant Labels (Top) */}
        <div className="flex mb-2">
          {participants.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => !isAnimating && ladderData.length > 0 && animatePath(idx)}
              disabled={isAnimating || ladderData.length === 0}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-t-lg transition-colors ${
                selectedIndex === idx
                  ? 'bg-red-500 text-white'
                  : 'bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)]'
              } ${isAnimating || ladderData.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={participants.length * 80}
          height={300}
          className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg"
          style={{ aspectRatio: `${participants.length * 80} / 300` }}
        />

        {/* Result Labels (Bottom) */}
        <div className="flex mt-2">
          {results.slice(0, participants.length).map(r => (
            <div
              key={r.id}
              className="flex-1 py-2 text-center text-sm font-medium bg-[var(--color-card)] border border-[var(--color-border)] rounded-b-lg"
            >
              {r.name}
            </div>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateLadder}
          disabled={participants.length < 2 || results.length < participants.length}
          className="mt-4 w-full py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t({ en: 'Generate Ladder', pt: 'Generate Ladder' })}
        </button>

        {/* Result Display */}
        {finalResult && (
          <div className="mt-4 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500 text-center">
            <div className="text-xl font-bold">{finalResult.participant}</div>
            <div className="text-3xl mt-2">👇</div>
            <div className="text-2xl font-bold text-primary-500 mt-2">{finalResult.result}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 min-w-0 space-y-4">
        {/* Participants */}
        <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">
              {t({ en: 'Participants', pt: 'Participants' })} ({participants.length})
            </h3>
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="text-sm text-primary-500 hover:underline"
            >
              {t({ en: 'Bulk Input', pt: 'Bulk Input' })}
            </button>
          </div>

          {showBulkInput ? (
            <div className="space-y-2 min-w-0">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={t({ en: 'Enter names separated by newlines or commas\nExample: Alice, Bob, Carol', pt: 'Enter names separated by newlines or commas\nExample: Alice, Bob, Carol' })}
                className="w-full max-w-full box-border h-32 p-2 text-sm border border-[var(--color-border)] rounded-lg resize-none bg-white text-zinc-900 placeholder:text-zinc-400"
              />
              <button
                onClick={handleBulkAdd}
                className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {t({ en: 'Apply', pt: 'Apply' })}
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3 min-w-0 w-full">
                <input
                  type="text"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  placeholder={t({ en: 'Enter name', pt: 'Enter name' })}
                  className="min-w-0 flex-1 box-border px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400"
                  maxLength={20}
                />
                <button
                  onClick={addParticipant}
                  disabled={participants.length >= 10}
                  className="shrink-0 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-[var(--color-bg)] rounded-lg">
                    <span className="text-sm truncate">{p.name}</span>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      disabled={participants.length <= 2}
                      className="text-red-500 hover:text-red-600 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Results */}
        <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] overflow-hidden">
          <h3 className="font-bold mb-3">
            {t({ en: 'Results', pt: 'Results' })} ({results.length})
          </h3>
          <div className="flex gap-2 mb-3 min-w-0 w-full">
            <input
              type="text"
              value={newResult}
              onChange={(e) => setNewResult(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addResult()}
              placeholder={t({ en: 'Enter result', pt: 'Enter result' })}
              className="min-w-0 flex-1 box-border px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400"
              maxLength={20}
            />
            <button
              onClick={addResult}
              disabled={results.length >= 10}
              className="shrink-0 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 bg-[var(--color-bg)] rounded-lg">
                <span className="text-sm truncate">{r.name}</span>
                <button
                  onClick={() => removeResult(r.id)}
                  disabled={results.length <= 2}
                  className="text-red-500 hover:text-red-600 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          {t({ en: 'Number of participants and results must match', pt: 'Number of participants and results must match' })}
        </p>
      </div>
    </div>
  );
}
