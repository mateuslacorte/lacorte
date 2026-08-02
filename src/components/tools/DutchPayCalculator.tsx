'use client';

import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Language } from '../../i18n';

interface Person {
  id: string;
  name: string;
  paid: number;
  shouldPay: number;
}

export default function DutchPayCalculator({ lang: initialLang }: { lang?: Language } = {}) {
  const { t, translations } = useTranslation(initialLang);
  const tc = translations.tools.dutchPay;
  const participantLabel = t({ en: 'Participant', pt: 'Participante' });

  const [totalAmount, setTotalAmount] = useState('');
  const [people, setPeople] = useState<Person[]>([
    { id: '1', name: `${participantLabel} 1`, paid: 0, shouldPay: 0 },
    { id: '2', name: `${participantLabel} 2`, paid: 0, shouldPay: 0 },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addPerson = () => {
    const newId = String(Date.now());
    setPeople([
      ...people,
      { id: newId, name: `${participantLabel} ${people.length + 1}`, paid: 0, shouldPay: 0 },
    ]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 2) return;
    setPeople(people.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, field: 'name' | 'paid', value: string | number) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const total = parseFloat(totalAmount) || 0;
  const perPerson = people.length > 0 ? total / people.length : 0;
  const totalPaid = people.reduce((sum, p) => sum + (p.paid || 0), 0);

  // Calculate who owes whom
  const calculateSettlements = () => {
    const balances = people.map((p) => ({
      name: p.name,
      balance: (p.paid || 0) - perPerson,
    }));

    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      if (amount > 0) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount),
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 1) i++;
      if (Math.abs(creditor.balance) < 1) j++;
    }

    return settlements;
  };

  const settlements = total > 0 ? calculateSettlements() : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Total Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t(tc.totalAmount)}
        </label>
        <div className="relative">
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="50000"
            className="w-full px-4 py-3 pr-12 rounded-lg border border-[var(--color-border)]
              bg-[var(--color-card)] text-[var(--color-text)] text-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            $
          </span>
        </div>
      </div>

      {/* Quick Split Display */}
      {total > 0 && (
        <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">{t(tc.perPerson)}</p>
              <p className="text-3xl font-bold text-primary-500">
                ${Math.ceil(perPerson).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--color-text-muted)]">{t({ en: 'Participants', pt: 'Participantes' })}</p>
              <p className="text-3xl font-bold text-[var(--color-text)]">{people.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick People Count */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t({ en: 'Group size', pt: 'Tamanho do grupo' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {[2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
            <button
              key={num}
              onClick={() => {
                const newPeople = Array.from({ length: num }, (_, i) => ({
                  id: String(i + 1),
                  name: `${participantLabel} ${i + 1}`,
                  paid: 0,
                  shouldPay: 0,
                }));
                setPeople(newPeople);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${people.length === num
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Mode Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-primary-500 hover:underline text-left"
      >
        {showAdvanced
          ? t({ en: '▼ Show simple view', pt: '▼ Ver visualização simples' })
          : t({ en: '▶ Enter individual payments (settlement)', pt: '▶ Informar pagamentos individuais (acerto de contas)' })}
      </button>

      {/* Advanced Mode - Individual Payments */}
      {showAdvanced && (
        <div className="space-y-4">
          <div className="space-y-3">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
              >
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-bg)] text-[var(--color-text)] text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    value={person.paid || ''}
                    onChange={(e) => updatePerson(person.id, 'paid', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-[var(--color-border)]
                      bg-[var(--color-bg)] text-[var(--color-text)] text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
                    $
                  </span>
                </div>
                <button
                  onClick={() => removePerson(person.id)}
                  disabled={people.length <= 2}
                  className="p-2 hover:bg-red-500/10 rounded text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addPerson}
            className="w-full py-2 border-2 border-dashed border-[var(--color-border)]
              rounded-lg text-[var(--color-text-muted)] hover:border-primary-500
              hover:text-primary-500 transition-colors"
          >
            + {t({ en: 'Add participant', pt: 'Adicionar participante' })}
          </button>

          {/* Settlement Results */}
          {settlements.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <h3 className="font-medium text-[var(--color-text)] mb-3">💸 {t({ en: 'Settlement plan', pt: 'Plano de acerto' })}</h3>
              <div className="space-y-2">
                {settlements.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-bg)]"
                  >
                    <span className="text-[var(--color-text)]">{s.from}</span>
                    <span className="text-[var(--color-text-muted)]">→</span>
                    <span className="text-[var(--color-text)]">{s.to}</span>
                    <span className="ml-auto font-bold text-primary-500">
                      ${s.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {totalPaid > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{t({ en: 'Total paid', pt: 'Total pago' })}</span>
                <span className="text-[var(--color-text)]">${totalPaid.toLocaleString()}</span>
              </div>
              {totalPaid !== total && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[var(--color-text-muted)]">{t({ en: 'Difference', pt: 'Diferença' })}</span>
                  <span className={totalPaid > total ? 'text-green-500' : 'text-red-500'}>
                    {totalPaid > total ? '+' : ''}${(totalPaid - total).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Common Scenarios */}
      <div className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <h3 className="font-medium text-[var(--color-text)] mb-3">💡 {t({ en: 'Quick examples', pt: 'Exemplos rápidos' })}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: t({ en: 'Fried chicken (4)', pt: 'Frango frito (4)' }), amount: 40000, people: 4 },
            { label: t({ en: 'BBQ dinner (4)', pt: 'Churrasco (4)' }), amount: 60000, people: 4 },
            { label: t({ en: 'Team dinner (6)', pt: 'Jantar da equipe (6)' }), amount: 300000, people: 6 },
            { label: t({ en: 'Cafe (3)', pt: 'Café (3)' }), amount: 30000, people: 3 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setTotalAmount(String(item.amount));
                setPeople(
                  Array.from({ length: item.people }, (_, i) => ({
                    id: String(i + 1),
                    name: `${participantLabel} ${i + 1}`,
                    paid: 0,
                    shouldPay: 0,
                  }))
                );
              }}
              className="px-3 py-2 rounded-lg text-left hover:bg-[var(--color-card-hover)]
                text-[var(--color-text-muted)] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
