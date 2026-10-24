'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Filter,
  Home,
  Menu,
  Plus,
  ReceiptIndianRupee,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import {
  PLATFORMS,
  STORAGE_KEY,
  Shift,
  ShiftInput,
  createEmptyShift,
  formatDate,
  formatMoney,
  getSummary,
  grossEarnings,
  netEarnings,
  operatingCosts,
  sortNewest,
  trueHourlyPay,
} from '@/lib/earnings';
import { cn } from '@/lib/cn';
import { KamaiClearAssistant } from '@/components/kamaiclear-assistant';
import { KamaiClearLogo } from '@/components/kamaiclear-logo';

type View = 'overview' | 'log' | 'history' | 'receipt';

const NAV_ITEMS: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'log', label: 'Log a shift', icon: Plus },
  { id: 'history', label: 'Shift history', icon: BarChart3 },
  { id: 'receipt', label: 'Net Pay Receipt', icon: ReceiptIndianRupee },
];

function readStoredShifts() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Shift[]) : [];
    return parsed.filter((shift) => !shift.id.startsWith('demo-'));
  } catch {
    return [];
  }
}

function writeStoredShifts(shifts: Shift[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
  } catch {
    // The app remains usable in restricted/private browser contexts.
  }
}

function inputValue(value: number | string) {
  return String(value ?? '');
}

export function KamaiClearApp() {
  const [view, setView] = useState<View>('overview');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState<ShiftInput>(createEmptyShift());
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<'all' | (typeof PLATFORMS)[number]>('all');
  const [notice, setNotice] = useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredShifts();
    setShifts(stored);
    setSelectedShiftId(stored[0]?.id ?? '');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const orderedShifts = useMemo(() => sortNewest(shifts), [shifts]);
  const summary = useMemo(() => getSummary(orderedShifts), [orderedShifts]);
  const selectedShift = orderedShifts.find((shift) => shift.id === selectedShiftId) ?? orderedShifts[0];
  const filteredShifts = useMemo(
    () => orderedShifts.filter((shift) => platformFilter === 'all' || shift.platform === platformFilter),
    [orderedShifts, platformFilter],
  );

  const currentFormGross = grossEarnings(form);
  const currentFormCosts = operatingCosts(form);
  const currentFormNet = netEarnings(form);
  const currentFormHourly = trueHourlyPay(form);

  function navigate(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateField<K extends keyof ShiftInput>(key: K, value: ShiftInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(createEmptyShift());
  }

  function saveCurrentShift() {
    if (!form.date || form.hours <= 0 || currentFormGross <= 0) {
      setNotice('Add a date, hours online and at least one earnings value.');
      return false;
    }

    const newShift: Shift = { ...form, id: `shift-${Date.now()}` };
    const nextShifts = [newShift, ...shifts].slice(0, 100);
    setShifts(nextShifts);
    setSelectedShiftId(newShift.id);
    writeStoredShifts(nextShifts);
    setNotice('Shift saved. Your Net Pay Receipt is ready.');
    resetForm();
    navigate('receipt');
    return true;
  }

  function saveShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCurrentShift();
  }

  function fillShift(fields: Partial<ShiftInput>) {
    setForm((current) => ({ ...current, ...fields }));
    setNotice('I filled the values I heard. Review them before saving.');
  }

  function deleteShift(id: string) {
    const nextShifts = shifts.filter((shift) => shift.id !== id);
    setShifts(nextShifts);
    writeStoredShifts(nextShifts);
    if (selectedShiftId === id) setSelectedShiftId(nextShifts[0]?.id ?? '');
    setNotice('Shift removed from this workspace.');
  }

  return (
    <div className="ak-shell">
      <aside className="ak-sidebar" aria-label="Primary navigation">
        <div>
          <KamaiClearLogo className="ak-brand" />
          <p className="ak-nav-label">Workspace</p>
          <nav className="ak-nav">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={cn('ak-nav-button', view === id && 'is-active')} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}>
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="ak-sidebar-bottom">
          <div className="ak-privacy-card"><ShieldCheck size={16} aria-hidden="true" /><div><strong>Private workspace</strong><p>Your records stay in this browser until you connect an account.</p></div></div>
          <div className="ak-user-card"><div className="ak-avatar" aria-hidden="true">KC</div><div><strong>Personal account</strong><span>Ready for your first shift</span></div></div>
        </div>
      </aside>

      <main className="ak-main">
        <header className="ak-topbar">
          <div><p className="ak-eyebrow">Worker-owned earnings log</p><p className="ak-topline">A clearer view of what your shift really paid.</p></div>
          <div className="ak-top-actions"><span className="ak-status-pill"><span className="ak-status-dot" />Workspace ready</span><button type="button" className="ak-mobile-menu" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={mobileNavOpen}><Menu size={18} /></button></div>
        </header>

        {mobileNavOpen && <nav className="ak-mobile-menu-panel" aria-label="Mobile navigation">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)} className={view === id ? 'is-active' : ''}><Icon size={16} />{label}</button>)}</nav>}

        {view === 'overview' && <OverviewView summary={summary} shifts={orderedShifts} hydrated={hydrated} onLog={() => navigate('log')} onHistory={() => navigate('history')} onReceipt={(id) => { setSelectedShiftId(id); navigate('receipt'); }} />}
        {view === 'log' && <LogView form={form} gross={currentFormGross} costs={currentFormCosts} net={currentFormNet} hourly={currentFormHourly} onChange={updateField} onSubmit={saveShift} onCancel={() => navigate('overview')} />}
        {view === 'history' && <HistoryView shifts={filteredShifts} platformFilter={platformFilter} onFilterChange={setPlatformFilter} onLog={() => navigate('log')} onReceipt={(id) => { setSelectedShiftId(id); navigate('receipt'); }} onDelete={deleteShift} />}
        {view === 'receipt' && <ReceiptView shift={selectedShift} onBack={() => navigate('history')} onLog={() => navigate('log')} />}

        <footer className="ak-footer"><span>KamaiClear · Clearer earnings for every shift</span><span>Private by default</span></footer>
      </main>

      <KamaiClearAssistant context={{ shifts: orderedShifts, currentView: view }} onNavigate={navigate} onFillShift={fillShift} onSaveShift={saveCurrentShift} />
      {notice && <div className="ak-toast" role="status"><Check size={16} aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    </div>
  );
}

function OverviewView({ summary, shifts, hydrated, onLog, onHistory, onReceipt }: { summary: ReturnType<typeof getSummary>; shifts: Shift[]; hydrated: boolean; onLog: () => void; onHistory: () => void; onReceipt: (id: string) => void }) {
  const chartShifts = [...shifts].slice(0, 7).reverse();
  const chartMax = Math.max(...chartShifts.map(trueHourlyPay), 130);
  const chartMin = Math.min(...chartShifts.map(trueHourlyPay), 0);

  return <section className="ak-view" aria-labelledby="overview-title">
    <div className="ak-hero-grid">
      <section className="ak-hero-card"><p className="ak-eyebrow">This week at a glance</p><h1 id="overview-title">See the money that actually stays with you.</h1><p>Record a shift in under a minute. Fuel, maintenance and waiting time are separated so your take-home number is never a guess.</p><button type="button" className="ak-primary-button" onClick={onLog}><Plus size={17} />Record today&apos;s shift</button></section>
      <section className="ak-feature-metric"><span className="ak-metric-label">True hourly pay</span><strong>{formatMoney(summary.hourly, 2)}</strong><span className="ak-trend"><ArrowUpRight size={14} />Gross payout minus operating costs</span><p>Across {summary.shifts || 0} recorded shift{summary.shifts === 1 ? '' : 's'}</p></section>
    </div>

    {!hydrated && <div className="ak-loading-note">Loading your local workspace…</div>}
    <div className="ak-stat-grid">
      <MetricCard label="Net this week" value={formatMoney(summary.net)} detail={`after ${formatMoney(summary.costs)} in costs`} tone="green" />
      <MetricCard label="Hours logged" value={`${summary.hours.toFixed(1)} h`} detail={`across ${summary.shifts} shift${summary.shifts === 1 ? '' : 's'}`} />
      <MetricCard label="Average cost rate" value={`${summary.costRate.toFixed(1)}%`} detail="fuel + maintenance + data" tone="amber" />
      <MetricCard label="Best shift" value={summary.best ? `${formatMoney(trueHourlyPay(summary.best))}/h` : '—'} detail={summary.best ? `${summary.best.platform} · ${formatDate(summary.best.date)}` : 'Record your first shift'} tone="red" />
    </div>

    <div className="ak-content-grid">
      <section className="ak-panel ak-panel-pad" aria-labelledby="trend-title"><div className="ak-panel-head"><div><h2 id="trend-title">Net hourly pay</h2><p>Your recorded shifts, measured after operating costs.</p></div><span className="ak-badge good">Worker-owned</span></div><div className="ak-chart" aria-label="Net hourly pay trend"><div className="ak-chart-grid"><span>₹120</span><span>₹80</span><span>₹40</span><span>₹0</span></div>{chartShifts.length > 0 ? <div className="ak-bars">{chartShifts.map((shift) => { const height = chartMax > chartMin ? ((trueHourlyPay(shift) - chartMin) / (chartMax - chartMin)) * 100 : 0; return <button type="button" key={shift.id} className="ak-bar-column" onClick={() => onReceipt(shift.id)} aria-label={`${formatDate(shift.date)} ${formatMoney(trueHourlyPay(shift), 2)} per hour`}><span className="ak-bar-value">{formatMoney(trueHourlyPay(shift))}</span><span className="ak-bar" style={{ height: `${Math.max(height, 10)}%` }} /><span className="ak-bar-label">{formatDate(shift.date)}</span></button>; })}</div> : <div className="ak-empty-state">No shift data yet. Record your first shift to build this trend.</div>}</div></section>
      <section className="ak-panel ak-panel-pad" aria-labelledby="recent-title"><div className="ak-panel-head"><div><h2 id="recent-title">Recent shifts</h2><p>A quick look at your latest entries.</p></div><button type="button" className="ak-text-button" onClick={onHistory}>View all <ChevronRight size={14} /></button></div><div className="ak-shift-list">{shifts.slice(0, 3).map((shift) => <button type="button" className="ak-shift-row" key={shift.id} onClick={() => onReceipt(shift.id)}><span className="ak-shift-icon">{shift.platform.slice(0, 1)}</span><span className="ak-shift-info"><strong>{shift.platform}</strong><small>{formatDate(shift.date)} · {shift.hours}h · {shift.orders} orders</small></span><span className="ak-shift-amount"><strong>{formatMoney(trueHourlyPay(shift), 2)}/h</strong><small>{formatMoney(netEarnings(shift))} net</small></span></button>)}{shifts.length === 0 && <div className="ak-empty-state">No shifts yet. Start with your first record.</div>}</div></section>
    </div>

    <section className="ak-trust-panel"><div className="ak-trust-icon"><ShieldCheck size={19} /></div><div><h2>Clear numbers. Better decisions.</h2><p>KamaiClear separates payout from operating cost so every shift is easier to understand before you decide what to do next.</p></div><span className="ak-trust-label">Worker-owned data</span></section>
  </section>;
}

function MetricCard({ label, value, detail, tone = '' }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className={cn('ak-stat-card', tone)}><span className="ak-metric-label">{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function LogView({ form, gross, costs, net, hourly, onChange, onSubmit, onCancel }: { form: ShiftInput; gross: number; costs: number; net: number; hourly: number; onChange: <K extends keyof ShiftInput>(key: K, value: ShiftInput[K]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const numeric = (key: Exclude<keyof ShiftInput, 'date' | 'platform' | 'note'>) => ({ value: inputValue(form[key]), onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(key, Number(event.target.value) || 0) });

  return <section className="ak-view" aria-labelledby="log-title"><div className="ak-page-head"><div><p className="ak-eyebrow">Make your shift count</p><h1 id="log-title">Record a shift</h1><p>The more honest the inputs, the more useful the number.</p></div><span className="ak-status-pill"><ShieldCheck size={14} />No platform login needed</span></div><div className="ak-form-layout"><form className="ak-panel ak-form-panel" onSubmit={onSubmit} noValidate>
    <FormSection title="01 · Shift details"><div className="ak-field-grid"><Field label="Date" htmlFor="shift-date"><input id="shift-date" type="date" value={form.date} onChange={(event) => onChange('date', event.target.value)} required /></Field><Field label="Platform" htmlFor="platform"><select id="platform" value={form.platform} onChange={(event) => onChange('platform', event.target.value as ShiftInput['platform'])}>{PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></Field><Field label="Hours online" htmlFor="hours"><input id="hours" type="number" min="0.1" step="0.1" {...numeric('hours')} required /></Field><Field label="Unpaid waiting hours" htmlFor="waiting-hours"><input id="waiting-hours" type="number" min="0" step="0.1" {...numeric('waitingHours')} /><small>Included in hours online</small></Field><Field label="Orders / trips" htmlFor="orders"><input id="orders" type="number" min="0" step="1" {...numeric('orders')} required /></Field><Field label="Kilometres travelled" htmlFor="kilometres"><input id="kilometres" type="number" min="0" step="1" {...numeric('kilometres')} required /></Field></div></FormSection>
    <FormSection title="02 · Money in"><div className="ak-field-grid"><CurrencyField label="Platform payout" id="payout" props={numeric('payout')} /><CurrencyField label="Tips" id="tips" props={numeric('tips')} /><CurrencyField label="Incentives" id="incentives" props={numeric('incentives')} /></div></FormSection>
    <FormSection title="03 · Money out"><div className="ak-field-grid"><CurrencyField label="Fuel / charging" id="fuel" props={numeric('fuel')} required /><CurrencyField label="Maintenance reserve" id="maintenance" props={numeric('maintenance')} required /><CurrencyField label="Phone & data" id="phone" props={numeric('phone')} required /><CurrencyField label="Other shift costs" id="other-cost" props={numeric('otherCost')} /></div></FormSection>
    <FormSection title="04 · Optional context"><Field label="Private note" htmlFor="note"><textarea id="note" value={form.note} onChange={(event) => onChange('note', event.target.value)} maxLength={240} placeholder="e.g. Heavy rain, long restaurant wait, festival demand" rows={3} /><small>{form.note.length}/240 characters</small></Field></FormSection>
    <div className="ak-info-callout"><CircleHelp size={17} aria-hidden="true" /><div><strong>Maintenance is a reserve, not a bill.</strong><span>Use a small amount per kilometre so future repairs are reflected in today&apos;s income.</span></div></div><div className="ak-form-actions"><button type="button" className="ak-secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="ak-primary-button"><WalletCards size={16} />Save shift & generate receipt</button></div>
  </form><aside className="ak-calculator" aria-labelledby="calculator-title"><p className="ak-eyebrow">Live calculation</p><h2 id="calculator-title">What stays with you</h2><p>Updates as you type. This is the number a gross payout hides.</p><CalcLine label="Gross earnings" value={formatMoney(gross)} /><CalcLine label="Operating costs" value={`− ${formatMoney(costs)}`} negative /><div className="ak-calc-total"><span>Net earnings</span><strong>{formatMoney(net)}</strong></div><div className="ak-calc-hour"><span>True hourly pay</span><strong>{formatMoney(hourly, 2)} / hr</strong></div><div className="ak-calc-meta"><span>Working time</span><strong>{form.hours.toFixed(1)}h online</strong></div><div className="ak-calc-meta"><span>Waiting time</span><strong>{form.waitingHours.toFixed(1)}h</strong></div></aside></div></section>;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) { return <div className="ak-form-section"><p className="ak-section-kicker">{title}</p>{children}</div>; }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) { return <div className="ak-field"><label htmlFor={htmlFor}>{label}</label>{children}</div>; }
function CurrencyField({ label, id, props, required = false }: { label: string; id: string; props: InputHTMLAttributes<HTMLInputElement>; required?: boolean }) { return <Field label={label} htmlFor={id}><div className="ak-input-prefix"><span>₹</span><input id={id} type="number" min="0" step="1" required={required} {...props} /></div></Field>; }
function CalcLine({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) { return <div className={cn('ak-calc-line', negative && 'negative')}><span>{label}</span><strong>{value}</strong></div>; }

function HistoryView({ shifts, platformFilter, onFilterChange, onLog, onReceipt, onDelete }: { shifts: Shift[]; platformFilter: 'all' | (typeof PLATFORMS)[number]; onFilterChange: (value: 'all' | (typeof PLATFORMS)[number]) => void; onLog: () => void; onReceipt: (id: string) => void; onDelete: (id: string) => void }) {
  return <section className="ak-view" aria-labelledby="history-title"><div className="ak-page-head"><div><p className="ak-eyebrow">Evidence, not estimates</p><h1 id="history-title">Shift history</h1><p>Every entry is your own record. Open a row to create its Net Pay Receipt.</p></div><button type="button" className="ak-primary-button" onClick={onLog}><Plus size={17} />Add shift</button></div><section className="ak-panel ak-panel-pad"><div className="ak-panel-head"><div><h2>All recorded shifts</h2><p>{shifts.length} shift{shifts.length === 1 ? '' : 's'} shown</p></div><label className="ak-filter"><Filter size={14} aria-hidden="true" /><span className="sr-only">Filter by platform</span><select value={platformFilter} onChange={(event) => onFilterChange(event.target.value as 'all' | (typeof PLATFORMS)[number])}><option value="all">All platforms</option>{PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label></div><div className="ak-table-wrap"><table className="ak-table"><thead><tr><th scope="col">Date</th><th scope="col">Platform</th><th scope="col">Gross</th><th scope="col">Costs</th><th scope="col">Net / hour</th><th scope="col">Signal</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{shifts.map((shift) => { const hourly = trueHourlyPay(shift); return <tr key={shift.id}><td><strong>{formatDate(shift.date)}</strong></td><td>{shift.platform}</td><td>{formatMoney(grossEarnings(shift))}</td><td>{formatMoney(operatingCosts(shift))}</td><td className={hourly >= 90 ? 'ak-positive' : 'ak-negative'}>{formatMoney(hourly, 2)}</td><td><span className={cn('ak-badge', hourly >= 105 ? 'good' : hourly >= 90 ? 'warn' : 'low')}>{hourly >= 105 ? 'Strong' : hourly >= 90 ? 'Watch costs' : 'Low margin'}</span></td><td><div className="ak-row-actions"><button type="button" className="ak-icon-button" onClick={() => onReceipt(shift.id)} aria-label={`Open receipt for ${formatDate(shift.date)}`}><FileText size={15} /></button><button type="button" className="ak-icon-button danger" onClick={() => onDelete(shift.id)} aria-label={`Delete shift from ${formatDate(shift.date)}`}><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table>{shifts.length === 0 && <div className="ak-empty-state">No shifts match this filter. Add a shift or choose another platform.</div>}</div></section></section>;
}

function ReceiptView({ shift, onBack, onLog }: { shift?: Shift; onBack: () => void; onLog: () => void }) {
  if (!shift) return <section className="ak-view"><div className="ak-empty-page"><ReceiptIndianRupee size={28} /><h1>No receipt yet</h1><p>Record a shift to generate your first Net Pay Receipt.</p><button type="button" className="ak-primary-button" onClick={onLog}><Plus size={16} />Record a shift</button></div></section>;
  const costs = operatingCosts(shift);
  const gross = grossEarnings(shift);
  const net = netEarnings(shift);
  const fuelPercent = costs ? Math.round((shift.fuel / costs) * 100) : 0;
  const maintenancePercent = costs ? Math.round((shift.maintenance / costs) * 100) : 0;
  const otherPercent = Math.max(0, 100 - fuelPercent - maintenancePercent);

  return <section className="ak-view" aria-labelledby="receipt-title"><div className="ak-page-head ak-print-hide"><div><p className="ak-eyebrow">Portable proof of your shift</p><h1 id="receipt-title">Net Pay Receipt</h1><p>A clear, shareable record of what the shift actually paid.</p></div><div className="ak-button-row"><button type="button" className="ak-secondary-button" onClick={onBack}>Back to history</button><button type="button" className="ak-primary-button" onClick={() => window.print()}><FileText size={16} />Print / save PDF</button></div></div><div className="ak-receipt-layout"><article className="ak-receipt-card"><div className="ak-receipt-top"><div className="ak-receipt-brand">KamaiClear</div><small>WORKER-OWNED<br />NET PAY RECEIPT</small></div><p className="ak-receipt-date">{formatDate(shift.date, true)}</p><h2>{shift.platform} · shift record</h2><div className="ak-receipt-highlight"><span>TRUE HOURLY PAY</span><strong>{formatMoney(trueHourlyPay(shift), 2)}</strong></div><div className="ak-receipt-lines"><ReceiptLine label="Gross earnings" value={formatMoney(gross)} /><ReceiptLine label="Fuel / charging" value={`− ${formatMoney(shift.fuel)}`} /><ReceiptLine label="Maintenance reserve" value={`− ${formatMoney(shift.maintenance)}`} /><ReceiptLine label="Phone & data" value={`− ${formatMoney(shift.phone)}`} /><ReceiptLine label="Other costs" value={`− ${formatMoney(shift.otherCost)}`} /><ReceiptLine label="Net earnings" value={formatMoney(net)} emphasis /></div><div className="ak-receipt-foot"><span>{shift.hours} hours · {shift.orders} orders · {shift.kilometres} km</span><span>Worker-owned record</span></div></article><aside className="ak-insight-stack ak-print-hide"><div className="ak-insight-card"><div className="ak-insight-icon"><ArrowUpRight size={17} /></div><h3>Why this matters</h3><p>A payout is not income until operating costs are removed. This receipt makes the calculation visible and portable.</p></div><div className="ak-insight-card"><div className="ak-insight-icon green"><Check size={17} /></div><h3>Shift signal</h3><p>This shift kept {gross > 0 ? ((net / gross) * 100).toFixed(1) : '0'}% of its gross payout after costs.</p></div><div className="ak-insight-card"><h3>Cost mix</h3><ReceiptBar label="Fuel / charging" value={fuelPercent} /><ReceiptBar label="Maintenance" value={maintenancePercent} tone="amber" /><ReceiptBar label="Phone + other" value={otherPercent} tone="blue" /></div></aside></div></section>;
}

function ReceiptLine({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className={cn('ak-receipt-line', emphasis && 'emphasis')}><span>{label}</span><strong>{value}</strong></div>; }
function ReceiptBar({ label, value, tone = '' }: { label: string; value: number; tone?: string }) { return <div className="ak-receipt-bar"><div><span>{label}</span><span>{value}%</span></div><i className={tone} style={{ width: `${value}%` }} /></div>; }
