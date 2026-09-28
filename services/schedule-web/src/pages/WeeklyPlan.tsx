import { useEffect, useRef, useState } from 'react';
import {
  Button, Card, CardHeader, Input, Subtitle1, Tab, TabList,
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Title1, Title3,
} from '@fluentui/react-components';
import {
  AddRegular, AlertRegular, ArrowDownloadRegular, CalendarLtrRegular, ClockRegular,
  DocumentPdfRegular, GridRegular, SaveRegular,
} from '@fluentui/react-icons';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import type { Schedule, Session } from '../api/types';

type ScheduleView = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Week';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export function WeeklyPlanPage() {
  const scheduleCardRef = useRef<HTMLDivElement | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ScheduleView>('Week');
  const [busy, setBusy] = useState(false);

  async function loadSchedule() {
    setLoading(true);
    setError('');
    try {
      setSchedule(await api.getCurrentSchedule());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please retry loading your schedule.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadSchedule(); }, []);

  async function updateSession(sessionId: string, updates: Partial<Session>) {
    if (!schedule) return;
    const sessions = schedule.sessions.map((session) => session.id === sessionId ? { ...session, ...updates } : session);
    setSchedule({ ...schedule, sessions });
  }

  async function saveSchedule() {
    if (!schedule) return;
    setBusy(true);
    try {
      setSchedule(await api.saveCurrentSchedule(schedule.weekOf, schedule.sessions));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your changes could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function generateSchedule() {
    setBusy(true);
    setError('');
    try {
      const result = await api.generateSchedule(schedule?.weekOf ?? '2026-09-28');
      setSchedule({ weekOf: schedule?.weekOf ?? '2026-09-28', sessions: result.sessions });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The schedule could not be generated.');
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    if (!scheduleCardRef.current || !schedule) return;

    try {
      setBusy(true);
      const [, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;
      const canvas = await html2canvas(scheduleCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const { jsPDF: PDFLib } = await import('jspdf');
      const pdf = new PDFLib({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 24;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const imageData = canvas.toDataURL('image/png');
      pdf.addImage(imageData, 'PNG', margin, margin, imageWidth, imageHeight);
      pdf.save(`schedule-plan-${schedule.weekOf}.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be generated.');
    } finally {
      setBusy(false);
    }
  }

  const visibleSessions = schedule?.sessions.filter((session) => view === 'Week' || session.day === view) ?? [];
  const totalHours = schedule?.sessions.reduce((total, session) => total + session.durationHours, 0) ?? 0;
  const days = [...new Set(schedule?.sessions.map((session) => session.day) ?? [])].join(', ');

  return (
    <main className="page-main weekly-page">
      <Card className="weekly-hero" appearance="filled-alternative">
        <svg className="hero-mesh" aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="none">
          <defs>
            <radialGradient id="hero-accent" cx="0%" cy="0%" r="80%"><stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.55" /><stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" /></radialGradient>
            <radialGradient id="hero-primary" cx="100%" cy="100%" r="80%"><stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.55" /><stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="800" height="400" fill="url(#hero-accent)" />
          <rect width="800" height="400" fill="url(#hero-primary)" />
        </svg>
        <div className="weekly-hero__copy">
          <p className="eyebrow"><span /> Week of September 28</p>
          <Title1>Make room for what matters this week.</Title1>
          <p className="hero-subtitle">Your goals, fixed commitments, and recovery time in one workable plan.</p>
        </div>
        <div className="hero-actions">
          <Button as="a" href="/goals" appearance="primary" icon={<AddRegular />}>Add a goal</Button>
          <Button as="a" href="/commitments" appearance="secondary" icon={<CalendarLtrRegular />}>Add commitment</Button>
        </div>
      </Card>

      <section className="kpi-row" aria-label="Weekly schedule summary">
        <Card className="kpi-card" appearance="outline">
          <div className="kpi-icon"><GridRegular /></div><span className="kpi-label">Planned sessions</span>
          <strong className="kpi-value">{loading ? '—' : schedule?.sessions.length ?? 0}</strong>
          <span className="kpi-detail">Across {days || 'your week'}</span>
        </Card>
        <Card className="kpi-card" appearance="outline">
          <div className="kpi-icon"><ClockRegular /></div><span className="kpi-label">Scheduled hours</span>
          <strong className="kpi-value">{loading ? '—' : totalHours.toFixed(1)} <small>h</small></strong>
          <span className="kpi-detail">Planned in focused 30-minute blocks</span>
        </Card>
        <Card className="kpi-card kpi-card--attention" appearance="outline">
          <div className="kpi-icon"><AlertRegular /></div><span className="kpi-label">Needs review</span>
          <strong className="kpi-value">{loading ? '—' : schedule?.sessions.filter((session) => session.status === 'Needs review').length ?? 0}</strong>
          <span className="kpi-detail">Check sessions before locking your week</span>
        </Card>
      </section>

      <section className="schedule-section" aria-labelledby="sessions-heading">
        <Card className="schedule-card" appearance="outline" ref={scheduleCardRef}>
          <CardHeader
            image={<span className="section-icon"><CalendarLtrRegular /></span>}
            header={<Title3 id="sessions-heading">This week's sessions</Title3>}
            description={<span className="muted-copy">Auto-fitted around commitments, sleep, and breaks</span>}
            action={<Subtitle1 className="section-count">{schedule?.sessions.length ?? 0} sessions in your plan</Subtitle1>}
          />
          <TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value as ScheduleView)} className="schedule-tabs" size="small" aria-label="Schedule view">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Week'] as ScheduleView[]).map((day) => <Tab key={day} value={day}>{day === 'Week' ? 'Week' : day.slice(0, 3)}</Tab>)}
          </TabList>
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => { void loadSchedule(); }} /> : !schedule || visibleSessions.length === 0 ? (
            <EmptyState title="No sessions in this view" description="Add a goal or regenerate your week to find a focused time for your work." action="Generate schedule" onAction={() => { void generateSchedule(); }} />
          ) : (
            <div className="table-scroll">
              <Table aria-label="Weekly focus sessions" size="small">
                <TableHeader><TableRow><TableHeaderCell>Day</TableHeaderCell><TableHeaderCell>Time</TableHeaderCell><TableHeaderCell>Session</TableHeaderCell><TableHeaderCell>Duration</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell></TableRow></TableHeader>
                <TableBody>
                  {visibleSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell><span className="day-label">{session.day.slice(0, 3)}</span><span className="date-label">{formatDate(session.date)}</span></TableCell>
                      <TableCell><span className="time-pair">{session.startTime}<span>–</span>{session.endTime}</span></TableCell>
                      <TableCell>
                        <Input aria-label={`Session title for ${session.day}`} className="session-input" value={session.title} onChange={(_, data) => { void updateSession(session.id, { title: data.value }); }} />
                        <span className="session-detail">Goal work · {session.status === 'Needs review' ? 'Review target fit' : 'Focus block'}</span>
                      </TableCell>
                      <TableCell>{session.durationHours} h</TableCell>
                      <TableCell><span className={`status-pill ${session.status === 'Needs review' ? 'status-pill--warning' : 'status-pill--success'}`}><i />{session.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {error && schedule && <ErrorState message={error} onRetry={() => { void loadSchedule(); }} />}
          <div className="schedule-actions">
            <span className="action-note">Changes stay clear of your fixed commitments and protected break times.</span>
            <div className="action-buttons">
              <Button appearance="secondary" icon={<DocumentPdfRegular />} disabled={busy || !schedule} onClick={() => { void exportPdf(); }}>Download PDF</Button>
              <Button appearance="secondary" icon={<SaveRegular />} disabled={!schedule || busy} onClick={() => { void saveSchedule(); }}>Save changes</Button>
              <Button appearance="primary" icon={<ArrowDownloadRegular />} disabled={busy} onClick={() => { void generateSchedule(); }}>Generate schedule</Button>
            </div>
          </div>
        </Card>
      </section>
      {schedule && <p className="page-footnote">Week beginning {formatDate(schedule.weekOf)} · <Link to="/goals">Review goal progress</Link></p>}
    </main>
  );
}