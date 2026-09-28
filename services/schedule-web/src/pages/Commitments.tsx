import { useEffect, useState, type FormEvent } from 'react';
import {
  Button, Card, Checkbox, Field, Input, Select, Table, TableBody, TableCell,
  TableHeader, TableHeaderCell, TableRow, Title1, Title3,
} from '@fluentui/react-components';
import { AddRegular, CalendarLtrRegular, DeleteRegular, EditRegular, ShieldCheckmarkRegular } from '@fluentui/react-icons';
import { api } from '../api';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import type { Commitment, CreateCommitmentInput, DayName } from '../api/types';

const defaultCommitment: CreateCommitmentInput = {
  title: 'College classes',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  startTime: '09:00',
  endTime: '13:00',
  protected: true,
  type: 'Fixed',
};

const dayOptions: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function daysLabel(days: DayName[]): string {
  if (days.length === 7) return 'Every day';
  if (days.join(',') === 'Monday,Tuesday,Wednesday,Thursday') return 'Mon–Thu';
  if (days.length > 1) return days.map((day) => day.slice(0, 3)).join(', ');
  return days[0] ?? 'Choose days';
}

export function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateCommitmentInput>(defaultCommitment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState('');

  async function loadCommitments() {
    setLoading(true); setError('');
    try { setCommitments(await api.listCommitments()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please retry loading commitments.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadCommitments(); }, []);

  function toggleDay(day: DayName, checked: boolean) {
    setForm((current) => ({ ...current, days: checked ? [...current.days, day] : current.days.filter((item) => item !== day) }));
  }

  function beginEdit(commitment: Commitment) {
    setEditingId(commitment.id);
    setForm({ title: commitment.title, days: commitment.days, startTime: commitment.startTime, endTime: commitment.endTime, protected: commitment.protected, type: commitment.type });
    setValidation('');
  }

  async function saveCommitment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.title.trim().length < 2) { setValidation('Enter a title with at least 2 characters.'); return; }
    if (form.days.length === 0) { setValidation('Choose at least one day for this commitment.'); return; }
    if (!form.startTime || !form.endTime || (form.startTime === form.endTime && form.type !== 'Protected')) { setValidation('Choose a valid start and end time.'); return; }
    setValidation('');
    try {
      if (editingId) await api.updateCommitment(editingId, { ...form, title: form.title.trim() });
      else await api.createCommitment({ ...form, title: form.title.trim() });
      setForm(defaultCommitment); setEditingId(null); await loadCommitments();
    } catch (cause) { setValidation(cause instanceof Error ? cause.message : 'The commitment could not be saved.'); }
  }

  async function deleteCommitment(commitment: Commitment) {
    if (!window.confirm(`Delete “${commitment.title}”? Your schedule may need to be regenerated.`)) return;
    try { await api.deleteCommitment(commitment.id); await loadCommitments(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The commitment could not be deleted.'); }
  }

  return (
    <main className="page-main commitments-page">
      <section className="page-heading">
        <div><p className="eyebrow eyebrow--plain"><span /> Your time, protected</p><Title1><CalendarLtrRegular /> Commitments</Title1><p className="muted-copy">Recurring time is protected before goal sessions are scheduled.</p></div>
        <span className="count-label">{commitments.length} commitments</span>
      </section>
      {error && <ErrorState message={error} onRetry={() => { void loadCommitments(); }} />}
      {loading ? <LoadingState rows={3} /> : commitments.length === 0 ? (
        <EmptyState title="No recurring commitments" description="Add classes, sleep, or personal time so your plan works around what is already fixed." action="Add a commitment" onAction={() => document.getElementById('commitment-title')?.focus()} />
      ) : (
        <Card className="commitment-table-card" appearance="outline">
          <div className="commitment-table-top"><div className="section-icon"><ShieldCheckmarkRegular /></div><span className="muted-copy">Protected blocks are kept clear during schedule generation.</span></div>
          <div className="table-scroll"><Table aria-label="Recurring commitments" size="small">
            <TableHeader><TableRow><TableHeaderCell>Commitment</TableHeaderCell><TableHeaderCell>Days</TableHeaderCell><TableHeaderCell>Time</TableHeaderCell><TableHeaderCell>Type</TableHeaderCell><TableHeaderCell><span className="sr-only">Actions</span></TableHeaderCell></TableRow></TableHeader>
            <TableBody>{commitments.map((commitment) => (
              <TableRow key={commitment.id}>
                <TableCell><strong>{commitment.title}</strong></TableCell>
                <TableCell>{daysLabel(commitment.days)}</TableCell>
                <TableCell>{commitment.startTime}–{commitment.endTime}</TableCell>
                <TableCell><span className={`status-pill ${commitment.protected ? 'status-pill--success' : 'status-pill--neutral'}`}><i />{commitment.type}</span></TableCell>
                <TableCell><div className="table-actions"><Button appearance="subtle" icon={<EditRegular />} aria-label={`Edit ${commitment.title}`} onClick={() => beginEdit(commitment)} /><Button appearance="subtle" icon={<DeleteRegular />} aria-label={`Delete ${commitment.title}`} onClick={() => { void deleteCommitment(commitment); }} /></div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></div>
        </Card>
      )}

      <Card className="editor-card commitment-editor" appearance="outline">
        <div className="section-heading"><div className="section-icon"><AddRegular /></div><div><Title3>{editingId ? 'Edit recurring commitment' : 'Add recurring commitment'}</Title3><p className="muted-copy">{editingId ? 'Update the times your schedule should protect.' : 'Set a regular block of time to keep clear.'}</p></div></div>
        <form className="commitment-form" onSubmit={(event) => { void saveCommitment(event); }} noValidate>
          <Field label="Title" required validationState={validation && form.title.trim().length < 2 ? 'error' : 'none'} validationMessage={validation && form.title.trim().length < 2 ? validation : undefined}>
            <Input id="commitment-title" value={form.title} onChange={(_, data) => setForm({ ...form, title: data.value })} />
          </Field>
          <fieldset className="days-fieldset"><legend>Days</legend><div className="day-options">{dayOptions.map((day) => <Checkbox key={day} checked={form.days.includes(day)} label={day.slice(0, 3)} onChange={(_, data) => toggleDay(day, Boolean(data.checked))} />)}</div></fieldset>
          <div className="form-grid form-grid--three">
            <Field label="Start time" required><Input type="time" value={form.startTime} onChange={(_, data) => setForm({ ...form, startTime: data.value })} /></Field>
            <Field label="End time" required><Input type="time" value={form.endTime} onChange={(_, data) => setForm({ ...form, endTime: data.value })} /></Field>
            <Field label="Type"><Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Commitment['type'] })}><option>Fixed</option><option>Protected</option><option>Personal</option></Select></Field>
          </div>
          <Checkbox checked={form.protected} label="Protect from scheduling" onChange={(_, data) => setForm({ ...form, protected: Boolean(data.checked) })} />
          {validation && <p className="form-error" role="alert">{validation}</p>}
          <div className="form-actions">{editingId && <Button type="button" appearance="secondary" onClick={() => { setEditingId(null); setForm(defaultCommitment); setValidation(''); }}>Cancel edit</Button>}<Button type="submit" appearance="primary" icon={<AddRegular />}>{editingId ? 'Save commitment changes' : 'Save commitment'}</Button></div>
        </form>
      </Card>
    </main>
  );
}