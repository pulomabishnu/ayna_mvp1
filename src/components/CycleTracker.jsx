import React, { useState, useEffect, useMemo } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';

const SYMPTOMS = ['Cramps', 'Bloating', 'Back Pain', 'Headache', 'Acne', 'Fatigue', 'Mood Swings', 'Breast Tenderness', 'Heaviness'];
const FLOW_LEVELS = ['Spotting', 'Light', 'Medium', 'Heavy', 'Super Heavy'];

// --- Cycle phase prediction (aligned with Clue, Ava, Ovia, research) ---
// Phases: Menstruation → Follicular → Ovulation/Fertile → Luteal.
// Luteal phase is relatively consistent per person (10–17 days; ~14 typical). Ovulation ≈ cycleLength - luteal.
// Fertile window: ~5–6 days (sperm survival + egg life); we use 5 days centered on estimated ovulation.
// Refs: npj Digital Medicine (cycle characteristics), Ava/Clue/Ovia algorithms (recent cycles, calendar method).
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const LUTEAL_DAYS = 14; // 10–17 typical; consistent per person (npj 2019)
const FERTILE_WINDOW_DAYS = 5; // 5-day fertile window (ovulDay ± 2) like major trackers
const MIN_GAP_DAYS_NEW_PERIOD = 3; // gap of 3+ days without flow = new period
const RECENT_CYCLES_FOR_PREDICTION = 6; // use last N cycles for median (Clue/Ovia style)

function parsePeriodsFromFlow(cycleData) {
    const withFlow = cycleData
        .filter(e => e.flow)
        .map(e => ({ date: e.date, ts: new Date(e.date).getTime() }))
        .sort((a, b) => a.ts - b.ts);
    if (withFlow.length === 0) return [];

    const periods = [];
    let start = withFlow[0].date;
    let prev = withFlow[0].date;

    for (let i = 1; i < withFlow.length; i++) {
        const d = withFlow[i].date;
        const prevDate = new Date(prev);
        const currDate = new Date(d);
        const diffDays = Math.round((currDate - prevDate) / (24 * 60 * 60 * 1000));
        if (diffDays > MIN_GAP_DAYS_NEW_PERIOD) {
            periods.push({ start, end: prev });
            start = d;
        }
        prev = d;
    }
    periods.push({ start, end: prev });
    return periods;
}

function getCycleLengths(periods) {
    if (periods.length < 2) return [];
    const lengths = [];
    for (let i = 0; i < periods.length - 1; i++) {
        const a = new Date(periods[i].start);
        const b = new Date(periods[i + 1].start);
        lengths.push(Math.round((b - a) / (24 * 60 * 60 * 1000)));
    }
    return lengths;
}

function getPeriodLengths(periods) {
    return periods.map(p => {
        const a = new Date(p.start);
        const b = new Date(p.end);
        return Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1;
    });
}

function median(arr) {
    if (arr.length === 0) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function getPhaseForDay(cycleDay, periodLength, cycleLength) {
    // Ovulation day = cycle length - luteal phase (fixed ~14 days; most variation is follicular).
    const ovulDay = Math.max(periodLength + 1, cycleLength - LUTEAL_DAYS);
    const fertileStart = Math.max(periodLength + 1, ovulDay - Math.floor(FERTILE_WINDOW_DAYS / 2));
    const fertileEnd = Math.min(cycleLength, ovulDay + Math.floor(FERTILE_WINDOW_DAYS / 2));
    if (cycleDay <= 0) return null;
    if (cycleDay <= periodLength) return { phase: 'menstruation', label: 'Menstruation', cycleDay };
    if (cycleDay < fertileStart) return { phase: 'follicular', label: 'Follicular', cycleDay };
    if (cycleDay <= fertileEnd) return { phase: 'ovulation', label: 'Ovulation / Fertile', cycleDay, ovulDay };
    if (cycleDay <= cycleLength) return { phase: 'luteal', label: 'Luteal', cycleDay };
    return { phase: 'luteal', label: 'Luteal (expected period)', cycleDay };
}

function computeCyclePhaseState(cycleData) {
    const periods = parsePeriodsFromFlow(cycleData);
    const cycleLengths = getCycleLengths(periods);
    const periodLengths = getPeriodLengths(periods);
    // Use recent cycles only for prediction (like Clue/Ovia) so predictions adapt to recent patterns.
    const recentCycleLengths = cycleLengths.length > RECENT_CYCLES_FOR_PREDICTION
        ? cycleLengths.slice(-RECENT_CYCLES_FOR_PREDICTION)
        : cycleLengths;
    const avgCycle = recentCycleLengths.length > 0
        ? Math.round(median(recentCycleLengths))
        : DEFAULT_CYCLE_LENGTH;
    const avgPeriod = periodLengths.length > 0
        ? Math.round(median(periodLengths))
        : DEFAULT_PERIOD_LENGTH;
    const lastPeriod = periods[periods.length - 1];
    const lastStart = lastPeriod ? new Date(lastPeriod.start) : null;

    // Next period prediction: last start + avg cycle length
    let nextStart = null;
    let nextEnd = null;
    if (lastStart) {
        nextStart = new Date(lastStart);
        nextStart.setDate(nextStart.getDate() + avgCycle);
        nextEnd = new Date(nextStart);
        nextEnd.setDate(nextEnd.getDate() + avgPeriod - 1);
    }

    // Per-cycle length for historical accuracy: cycle i has length to period i+1, or avgCycle for last.
    const getCycleLengthForPeriodIndex = (periodIndex) => {
        if (periodIndex < 0 || periodIndex >= periods.length) return avgCycle;
        if (periodIndex < periods.length - 1) {
            const a = new Date(periods[periodIndex].start);
            const b = new Date(periods[periodIndex + 1].start);
            return Math.round((b - a) / (24 * 60 * 60 * 1000));
        }
        return avgCycle;
    };

    const getPhaseForDate = (dateStr) => {
        if (!lastStart || periods.length === 0) return null;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const nextStartNorm = nextStart ? new Date(nextStart) : null;
        if (nextStartNorm) nextStartNorm.setHours(0, 0, 0, 0);

        let cycleStart;
        let periodLength;
        let cycleLength;

        const lastStartNorm = new Date(lastStart);
        lastStartNorm.setHours(0, 0, 0, 0);

        if (nextStartNorm && d >= nextStartNorm) {
            // Date is on or after predicted next period: treat as new cycle (roll forward like Avia/Clue).
            cycleStart = new Date(nextStartNorm);
            periodLength = avgPeriod;
            cycleLength = avgCycle;
        } else if (d >= lastStartNorm) {
            // Current cycle (from last period start to before next predicted).
            cycleStart = new Date(lastStartNorm);
            periodLength = avgPeriod;
            cycleLength = avgCycle;
        } else {
            // Historical: find which period this date falls in.
            let periodIndex = -1;
            for (let i = periods.length - 1; i >= 0; i--) {
                const pStart = new Date(periods[i].start);
                pStart.setHours(0, 0, 0, 0);
                if (d >= pStart) {
                    periodIndex = i;
                    break;
                }
            }
            if (periodIndex < 0) return null;
            cycleStart = new Date(periods[periodIndex].start);
            cycleStart.setHours(0, 0, 0, 0);
            const periodLenArr = getPeriodLengths(periods);
            periodLength = periodIndex < periodLenArr.length ? periodLenArr[periodIndex] : avgPeriod;
            cycleLength = getCycleLengthForPeriodIndex(periodIndex);
        }

        const cycleDay = Math.round((d - cycleStart) / (24 * 60 * 60 * 1000)) + 1;
        return getPhaseForDay(cycleDay, periodLength, cycleLength);
    };

    return {
        periods,
        avgCycleLength: avgCycle,
        avgPeriodLength: avgPeriod,
        lastPeriodStart: lastStart,
        nextStart,
        nextEnd,
        getPhaseForDate
    };
}

export default function CycleTracker({ cycleData, setCycleData, myProducts, trackedProducts, onToggleMyProduct, onToggleTrackedProduct, omittedProducts, toggleOmitProduct, onOpenProduct }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('log'); // 'log' or 'recommendations'
    const [expandedSymptoms, setExpandedSymptoms] = useState({});

    // Form state corresponding to selectedDate
    const [flow, setFlow] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState(new Set());
    const [notes, setNotes] = useState('');

    // Hydrate form when selectedDate changes
    useEffect(() => {
        const existingEntry = cycleData.find(e => e.date === selectedDate);
        if (existingEntry) {
            setFlow(existingEntry.flow || '');
            setSelectedSymptoms(new Set(existingEntry.symptoms || []));
            setNotes(existingEntry.notes || '');
        } else {
            setFlow('');
            setSelectedSymptoms(new Set());
            setNotes('');
        }
    }, [selectedDate, cycleData]);

    const handleSave = () => {
        const entry = {
            date: selectedDate,
            flow,
            symptoms: Array.from(selectedSymptoms),
            notes
        };

        setCycleData(prev => {
            const filtered = prev.filter(e => e.date !== selectedDate);
            // Only add if there's actually something logged
            if (flow || entry.symptoms.length > 0 || notes) {
                return [...filtered, entry].sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        });
    };

    const toggleSymptom = (s) => {
        const next = new Set(selectedSymptoms);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        setSelectedSymptoms(next);
    };

    // Calendar & prediction: use period-based cycle length + phase logic (like Clue/Avia/Ovia)
    const cycleState = useMemo(() => computeCyclePhaseState(cycleData), [cycleData]);
    const predictions = useMemo(() => ({
        nextStart: cycleState.nextStart,
        nextEnd: cycleState.nextEnd
    }), [cycleState.nextStart, cycleState.nextEnd]);

    // Current phase for selected date (and today)
    const phaseForSelected = cycleState.getPhaseForDate(selectedDate);
    const phaseForToday = cycleState.getPhaseForDate(new Date().toISOString().split('T')[0]);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayIndex = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            days.push(dateString);
        }
        return days;
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const isDateInPredictedWindow = (dateStr) => {
        if (!predictions.nextStart) return false;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const start = new Date(predictions.nextStart); start.setHours(0, 0, 0, 0);
        const end = new Date(predictions.nextEnd); end.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
    };

    // ----- Recommendation Logic based on current logged symptoms/flow -----
    const recommendationGroups = useMemo(() => {
        if (!flow && selectedSymptoms.size === 0) return [];

        const groups = [];

        if (flow === 'Heavy' || flow === 'Super Heavy') {
            const heavyMatches = ALL_PRODUCTS.filter(p => p.tags.includes('heavy-flow') || p.tags.includes('leaks')).map(p => ({ ...p, recommendedFor: 'Heavy Flow' }));
            if (heavyMatches.length > 0) groups.push({ label: 'Heavy Flow', products: heavyMatches.slice(0, 3) });
        }

        const symptomConfigs = [
            { id: 'Cramps', tags: ['cramps', 'discomfort'], label: 'Cramps' },
            { id: 'Bloating', tags: ['cramps', 'discomfort', 'bloating'], label: 'Bloating' },
            { id: 'Fatigue', names: ['Magnesium', 'Iron', 'MegaFood', 'Energy'], label: 'Fatigue' },
            { id: 'Mood Swings', category: 'mental-health', names: ['28'], label: 'Mood Swings' },
            { id: 'Headache', tags: ['pain', 'discomfort'], label: 'Headaches' },
            { id: 'Acne', tags: ['skincare', 'acne', 'breakouts', 'skin'], category: 'skincare', label: 'Acne' },
            { id: 'Breast Tenderness', tags: ['discomfort', 'pain', 'body'], label: 'Breast Tenderness' }
        ];

        symptomConfigs.forEach(config => {
            if (selectedSymptoms.has(config.id)) {
                let matches = ALL_PRODUCTS.filter(p => {
                    let match = false;
                    if (config.tags) match = match || config.tags.some(t => p.tags.includes(t));
                    if (config.names) match = match || config.names.some(n => p.name.includes(n));
                    if (config.category && p.category) match = match || p.category.includes(config.category);
                    return match;
                });

                if (matches.length > 0) {
                    matches = matches.map(p => ({ ...p, recommendedFor: config.label }));
                    groups.push({ label: config.label, products: matches.slice(0, 3) });
                }
            }
        });

        return groups;
    }, [flow, selectedSymptoms]);

    // ----- Cycle Insights Logic -----
    const insights = useMemo(() => {
        if (!cycleData || cycleData.length === 0) return null;

        let totalSymptoms = {};
        let flowDays = 0;
        let flowCount = { 'Spotting': 0, 'Light': 0, 'Medium': 0, 'Heavy': 0, 'Super Heavy': 0 };

        cycleData.forEach(entry => {
            if (entry.flow) {
                flowDays++;
                flowCount[entry.flow] = (flowCount[entry.flow] || 0) + 1;
            }
            if (entry.symptoms) {
                entry.symptoms.forEach(s => {
                    totalSymptoms[s] = (totalSymptoms[s] || 0) + 1;
                });
            }
        });

        const sortedSymptoms = Object.entries(totalSymptoms).sort((a, b) => b[1] - a[1]);
        const topSymptom = sortedSymptoms.length > 0 ? sortedSymptoms[0][0] : 'None logged';

        const sortedFlow = Object.entries(flowCount).filter(f => f[1] > 0).sort((a, b) => b[1] - a[1]);
        const commonFlow = sortedFlow.length > 0 ? sortedFlow[0][0] : 'None logged';

        return {
            totalEntries: cycleData.length,
            flowDays,
            topSymptom,
            commonFlow,
            avgCycleLength: cycleState.avgCycleLength,
            avgPeriodLength: cycleState.avgPeriodLength,
            periodCount: cycleState.periods.length
        };
    }, [cycleData, cycleState.avgCycleLength, cycleState.avgPeriodLength, cycleState.periods.length]);


    const calendarDays = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="container animate-fade-in-up" style={{ padding: 'var(--spacing-lg) var(--spacing-md)', maxWidth: '1100px' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--color-secondary-fade)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    My Body, My Rhythms
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Cycle Tracker</h2>

                {predictions.nextStart ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--color-surface-soft)',
                            padding: '1rem 2rem',
                            borderRadius: 'var(--radius-pill)',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🔮</span>
                            <span style={{ fontWeight: '500' }}>Predicted next cycle:</span>
                            <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                                {predictions.nextStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </strong>
                        </div>
                        {phaseForToday && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1.25rem',
                                background: 'var(--color-secondary-fade)',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '0.95rem',
                                color: 'var(--color-text-main)'
                            }}>
                                <span style={{ opacity: 0.9 }}>Today:</span>
                                <strong style={{ color: 'var(--color-primary)' }}>{phaseForToday.label}</strong>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    (Day {phaseForToday.cycleDay}
                                    {cycleState.avgCycleLength && ` of ~${cycleState.avgCycleLength}`})
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
                        Log your flow to activate smart predictions and phase tracking (Menstruation → Follicular → Ovulation → Luteal).
                    </p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '3rem', alignItems: 'start' }}>

                {/* Calendar View */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '600' }}>
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={prevMonth} className="btn-outline" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>←</button>
                            <button onClick={nextMonth} className="btn-outline" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>→</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                        {weekDays.map(day => (
                            <div key={day} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                        {calendarDays.map((dateStr, idx) => {
                            if (!dateStr) return <div key={`empty-${idx}`} style={{ padding: '1rem' }} />;

                            const dayNum = parseInt(dateStr.split('-')[2], 10);
                            const isSelected = dateStr === selectedDate;

                            // Check data for this day
                            const entry = cycleData.find(e => e.date === dateStr);
                            const hasFlow = !!(entry && entry.flow);
                            const hasSymptoms = !!(entry && entry.symptoms && entry.symptoms.length > 0);
                            const isPredicted = isDateInPredictedWindow(dateStr);
                            const phaseInfo = cycleState.getPhaseForDate(dateStr);
                            const phaseColors = {
                                menstruation: 'rgba(180, 80, 100, 0.2)',
                                follicular: 'rgba(100, 140, 200, 0.15)',
                                ovulation: 'rgba(220, 160, 80, 0.2)',
                                luteal: 'rgba(120, 160, 120, 0.15)'
                            };
                            const phaseBg = phaseInfo && !hasFlow && !isSelected ? phaseColors[phaseInfo.phase] || 'transparent' : undefined;

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    title={phaseInfo ? `${phaseInfo.label} (Day ${phaseInfo.cycleDay})` : undefined}
                                    style={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        fontWeight: '500',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.2s',
                                        background: isSelected ? 'var(--color-primary)' : hasFlow ? 'var(--color-secondary)' : isPredicted ? 'var(--color-secondary-fade)' : phaseBg || 'transparent',
                                        color: isSelected ? 'white' : hasFlow ? 'var(--color-primary-hover)' : 'var(--color-text-main)',
                                        border: isPredicted && !isSelected && !hasFlow ? '1px dashed var(--color-primary)' : '1px solid transparent',
                                        boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                >
                                    {dayNum}
                                    {/* Indicators underneath number */}
                                    <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '15%' }}>
                                        {hasFlow && !isSelected && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary-hover)' }}></span>}
                                        {hasSymptoms && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'white' : 'var(--color-text-muted)' }}></span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {cycleState.periods.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(180,80,100,0.4)', verticalAlign: 'middle', marginRight: 4 }} /> Menstruation</span>
                            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(100,140,200,0.4)', verticalAlign: 'middle', marginRight: 4 }} /> Follicular</span>
                            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(220,160,80,0.4)', verticalAlign: 'middle', marginRight: 4 }} /> Ovulation / Fertile</span>
                            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(120,160,120,0.4)', verticalAlign: 'middle', marginRight: 4 }} /> Luteal</span>
                        </div>
                    )}
                </div>

                {/* Right Panel: Tabs for Logger & Recommendations */}
                <div className="card" style={{ borderTop: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-soft)' }}>
                        <button
                            style={{
                                flex: 1,
                                padding: '1.2rem',
                                fontWeight: '600',
                                color: activeTab === 'log' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === 'log' ? '3px solid var(--color-primary)' : '3px solid transparent',
                                background: activeTab === 'log' ? 'var(--color-bg)' : 'transparent',
                                fontSize: '1.1rem'
                            }}
                            onClick={() => setActiveTab('log')}
                        >
                            Daily Log
                        </button>
                        <button
                            style={{
                                flex: 1,
                                padding: '1.2rem',
                                fontWeight: '600',
                                color: activeTab === 'recommendations' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === 'recommendations' ? '3px solid var(--color-primary)' : '3px solid transparent',
                                background: activeTab === 'recommendations' ? 'var(--color-bg)' : 'transparent',
                                fontSize: '1.1rem'
                            }}
                            onClick={() => setActiveTab('recommendations')}
                        >
                            Action Plan
                        </button>
                        <button
                            style={{
                                flex: 1,
                                padding: '1.2rem',
                                fontWeight: '600',
                                color: activeTab === 'insights' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === 'insights' ? '3px solid var(--color-primary)' : '3px solid transparent',
                                background: activeTab === 'insights' ? 'var(--color-bg)' : 'transparent',
                                fontSize: '1.1rem'
                            }}
                            onClick={() => setActiveTab('insights')}
                        >
                            Insights
                        </button>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {activeTab === 'log' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', color: 'var(--color-text-main)' }}>
                                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                    </h3>
                                    {phaseForSelected && (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{phaseForSelected.label}</span>
                                            {' · '}Cycle day {phaseForSelected.cycleDay}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--color-text-main)', fontSize: '1rem' }}>Flow Intensity</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {FLOW_LEVELS.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFlow(flow === f ? '' : f)}
                                                className={`btn ${flow === f ? 'btn-primary' : 'btn-outline'}`}
                                                style={{
                                                    fontSize: '0.8rem',
                                                    padding: '0.5rem 0.8rem',
                                                    borderRadius: 'var(--radius-md)',
                                                }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--color-text-main)', fontSize: '1rem' }}>Symptoms</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {SYMPTOMS.map(s => {
                                            const isSelected = selectedSymptoms.has(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => toggleSymptom(s)}
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        padding: '0.5rem 0.8rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                        background: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                                                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                        fontWeight: isSelected ? '600' : '400',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--color-text-main)', fontSize: '1rem' }}>Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Journal your feelings or specific physical signs..."
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            minHeight: '80px',
                                            fontFamily: 'inherit',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary shadow-sm hover-lift"
                                    style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: '600' }}
                                    onClick={handleSave}
                                >
                                    Save for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </button>
                            </div>
                        )}

                        {activeTab === 'recommendations' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Ecosystem Action Plan</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                        Based on your symptoms for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}, we suggest leaning on these tools:
                                    </p>
                                </div>

                                {recommendationGroups.length === 0 ? (
                                    <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: '0.5' }}>💡</div>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Log symptoms or flow intensity in the Daily Log to see personalized action items.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {recommendationGroups.map(group => {
                                            const isExpanded = expandedSymptoms[group.label];
                                            return (
                                                <div key={group.label} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-soft)', overflow: 'hidden' }}>
                                                    <button
                                                        onClick={() => setExpandedSymptoms(prev => ({ ...prev, [group.label]: !prev[group.label] }))}
                                                        style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'var(--color-secondary-fade)' : 'transparent', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', textAlign: 'left' }}
                                                    >
                                                        <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-primary)' }}>Top Products for {group.label}</h4>
                                                        <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>{isExpanded ? '−' : '+'}</span>
                                                    </button>

                                                    {isExpanded && (
                                                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInDown 0.3s ease' }}>
                                                            {group.products.map(product => {
                                                                const inEcosystem = !!myProducts?.[product.id];
                                                                const categoryLabel = CATEGORY_LABELS ? (CATEGORY_LABELS[product.category] || product.category) : product.category;

                                                                return (
                                                                    <div key={product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => onOpenProduct(product)} className="hover-lift">
                                                                        <img src={product.image} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                                                                        <div style={{ flex: 1 }}>
                                                                            <span style={{ color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                                                                {categoryLabel}
                                                                            </span>
                                                                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                                {product.name}
                                                                                {product.outOfBusiness && (
                                                                                    <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>
                                                                                )}
                                                                            </h4>
                                                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                                                                                {inEcosystem ? (
                                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-primary)', background: 'var(--color-secondary-fade)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>✅ In Ecosystem</span>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); onToggleMyProduct && onToggleMyProduct(product); }}
                                                                                        style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--color-surface-soft)', background: 'var(--color-primary)', border: `1px solid var(--color-primary)`, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
                                                                                    >
                                                                                        + Add to Ecosystem
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Your Cycle Insights</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                        A summary of your tracked patterns across all logged data.
                                    </p>
                                </div>

                                {insights ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩸</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Most Common Flow</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '0.2rem' }}>{insights.commonFlow}</div>
                                        </div>
                                        <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤕</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Top Symptom</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '0.2rem' }}>{insights.topSymptom}</div>
                                        </div>
                                        <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Total Days Logged</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '0.2rem' }}>{insights.totalEntries} Days</div>
                                        </div>
                                        <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌊</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Total Flow Days</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '0.2rem' }}>{insights.flowDays} Days</div>
                                        </div>
                                        {insights.periodCount > 0 && insights.avgCycleLength != null && (
                                            <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Phase prediction</div>
                                                <div style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '0.5rem' }}>
                                                    Average cycle: <strong style={{ color: 'var(--color-primary)' }}>{insights.avgCycleLength} days</strong>
                                                    {insights.avgPeriodLength != null && (
                                                        <> · Average period: <strong style={{ color: 'var(--color-primary)' }}>{insights.avgPeriodLength} days</strong></>
                                                    )}
                                                    <> · Based on <strong>{insights.periodCount} period{insights.periodCount !== 1 ? 's' : ''}</strong></>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                                                    Ovulation window is estimated at ~day {insights.avgCycleLength - 14} (±2 days). We use your last 6 cycles and a 5-day fertile window (like Clue/Avia). More data improves accuracy.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: '0.5' }}>📊</div>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Log more data to see your cycle insights over time.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>


        </div>
    );
}
