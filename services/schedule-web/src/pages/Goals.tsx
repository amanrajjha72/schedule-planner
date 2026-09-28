import { useEffect, useState, type FormEvent } from 'react';
import {
  Body1, Button, Card, Field, Input, MessageBar, MessageBarBody,
  Select, Skeleton, SkeletonItem, Title1, Title3,
} from '@fluentui/react-components';
import { AddRegular, AlertRegular, BoxRegular, ChartMultipleRegular, DeleteRegular, EditRegular, FlagRegular } from '@fluentui/react-icons';
import { api } from '../api';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import type { CreateGoalInput, Goal, Priority } from '../api/types';

const blankGoal: CreateGoalInput = { title: '', description: '', deadline: '', priority: 'Medium', targetHours: 4 };

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreateGoalInput>(blankGoal);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState('');

  async function loadGoals() {
    setLoading(true);
    setError('');
    try { setGoals(await api.listGoals()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please retry loading goals.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadGoals(); }, []);

  function beginEdit(goal: Goal) {
    setEditingId(goal.id);
    setForm({ title: goal.title, description: goal.description, deadline: goal.deadline, priority: goal.priority, targetHours: goal.targetHours });
    setFormOpen(true);
    setValidation('');
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.title.trim().length < 4) { setValidation('Use at least 4 characters for the goal title.'); return; }
    if (!form.deadline || form.targetHours <= 0) { setValidation('Choose a deadline and enter target hours greater than zero.'); return; }
    setValidation('');
    try {
      if (editingId) await api.updateGoal(editingId, form);
      else await api.createGoal({ ...form, title: form.title.trim() });
      setForm(blankGoal); setEditingId(null); setFormOpen(false); await loadGoals();
    } catch (cause) { setValidation(cause instanceof Error ? cause.message : 'The goal could not be saved.'); }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm(`Delete “${goal.title}”? This cannot be undone.`)) return;
    try { await api.deleteGoal(goal.id); await loadGoals(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The goal could not be deleted.'); }
  }

  const atRisk = goals.filter((goal) => goal.status === 'At risk').length;

  return (
    <main className="page-main goals-page">
      <section className="page-heading">
        <div><p className="eyebrow eyebrow--plain"><span /> Make steady progress</p><Title1><ChartMultipleRegular /> Active goals</Title1><p className="muted-copy">Track deadlines, weekly effort, and the work already on your calendar.</p></div>
        <span className="count-label">{goals.length} active</span>
      </section>
      {atRisk > 0 && <MessageBar intent="warning" className="notice-bar"><AlertRegular /><MessageBarBody><strong>{atRisk} goal{atRisk > 1 ? 's are' : ' is'} at risk.</strong> Revisit its target hours or make room in your weekly plan.</MessageBarBody></MessageBar>}
      {loading ? <LoadingState rows={3} /> : error ? <ErrorState message={error} onRetry={() => { void loadGoals(); }} /> : goals.length === 0 ? (
        <EmptyState title="No active goals yet" description="Add a goal and give it a deadline. Your weekly plan will help make room for it." action="Add your first goal" onAction={() => { setFormOpen(true); }} />
      ) : (
        <section className="goal-list" aria-label="Active goals">
          {goals.map((goal) => (
            <Card key={goal.id} className="goal-card" appearance="outline">
              <div className="goal-card__top">
                <div className="goal-title-wrap"><FlagRegular /><Title3>{goal.title}</Title3></div>
                <span className={`status-pill ${goal.status === 'At risk' ? 'status-pill--warning' : 'status-pill--success'}`}><i />{goal.status}</span>
              </div>
              <p className="goal-description">{goal.description}</p>
              <div className="goal-meta">
                <span>Due <time dateTime={goal.deadline}>{dateLabel(goal.deadline)}</time></span>
                <span>Priority: <strong className={goal.priority === 'High' ? 'priority-high' : ''}>{goal.priority}</strong></span>
                <span>Target: <strong>{goal.targetHours} h/week</strong></span>
                <span>Scheduled: <strong>{goal.scheduledHours} h/week</strong></span>
              </div>
              <div className="goal-progress" aria-label={`${goal.scheduledHours} of ${goal.targetHours} weekly hours scheduled`}>
                <span style={{ width: `${Math.min(100, goal.scheduledHours / goal.targetHours * 100)}%` }} />
              </div>
              <div className="row-actions">
                <Button appearance="subtle" icon={<EditRegular />} onClick={() => beginEdit(goal)}>Edit goal</Button>
                <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => { void deleteGoal(goal); }}>Delete goal</Button>
              </div>
            </Card>
          ))}
        </section>
      )}
      {(loading || goals.length > 0) && (
        <section className="progress-section" aria-labelledby="recalculating-heading">
          <div className="section-heading">
            <div className="section-icon"><ChartMultipleRegular /></div>
            <div><Title3 id="recalculating-heading">Recalculating next week's progress</Title3><p className="muted-copy">Updating from your latest weekly plan</p></div>
          </div>
          {loading ? (
            <div className="progress-skeletons" aria-busy="true" aria-label="Recalculating next week's progress">
              {[0, 1].map((item) => <Card key={item} className="progress-skeleton-card" appearance="outline" aria-hidden="true"><Skeleton><SkeletonItem className="progress-skeleton-title" /><SkeletonItem className="progress-skeleton-line" /><SkeletonItem className="progress-skeleton-line progress-skeleton-line--short" /></Skeleton></Card>)}
            </div>
          ) : (
            <div className="progress-skeletons" aria-live="polite">
              {goals.slice(0, 2).map((goal) => (
                <Card key={goal.id} className="progress-skeleton-card" appearance="outline">
                  <Title3>{goal.title}</Title3>
                  <span className="muted-copy">{goal.scheduledHours} of {goal.targetHours} h scheduled</span>
                  <div className="goal-progress"><span style={{ width: `${Math.min(100, (goal.scheduledHours / goal.targetHours) * 100)}%` }} /></div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="completed-section" aria-labelledby="completed-heading">
        <div className="section-heading">
          <div className="section-icon"><BoxRegular /></div>
          <div><Title3 id="completed-heading">Completed this week</Title3><p className="muted-copy">0 goals</p></div>
        </div>
        <Card className="completed-empty" appearance="outline">
          <BoxRegular className="completed-empty__icon" aria-hidden="true" />
          <Title3>No goals completed this week</Title3>
          <Body1 className="muted-copy">Your active goals are listed above. Review their upcoming blocks to choose what to focus on next.</Body1>
          <Button appearance="primary" icon={<ChartMultipleRegular />} onClick={() => document.querySelector('.goal-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Review active goals</Button>
        </Card>
      </section>
      {formOpen && (
        <Card className="editor-card" appearance="outline">
          <div className="section-heading"><div className="section-icon"><AddRegular /></div><div><Title3>{editingId ? 'Edit goal' : 'Add a goal'}</Title3><p className="muted-copy">Set a clear target and a realistic deadline.</p></div></div>
          <form className="goal-form" onSubmit={(event) => { void saveGoal(event); }} noValidate>
            <Field label="Goal" required validationState={validation && form.title.trim().length < 4 ? 'error' : 'none'} validationMessage={validation && form.title.trim().length < 4 ? validation : undefined}>
              <Input value={form.title} onChange={(_, data) => setForm({ ...form, title: data.value })} placeholder="e.g. Finish the literature review" />
            </Field>
            <Field label="Description"><Input value={form.description} onChange={(_, data) => setForm({ ...form, description: data.value })} placeholder="What does done look like?" /></Field>
            <div className="form-grid form-grid--three">
              <Field label="Deadline" required><Input type="date" value={form.deadline} onChange={(_, data) => setForm({ ...form, deadline: data.value })} /></Field>
              <Field label="Priority"><Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}><option>High</option><option>Medium</option><option>Low</option></Select></Field>
              <Field label="Target hours per week" required><Input type="number" min="0.5" step="0.5" value={String(form.targetHours)} onChange={(_, data) => setForm({ ...form, targetHours: Number(data.value) })} /></Field>
            </div>
            {validation && <p className="form-error" role="alert">{validation}</p>}
            <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => { setFormOpen(false); setEditingId(null); setValidation(''); }}>Cancel</Button><Button type="submit" appearance="primary" icon={<AddRegular />}>{editingId ? 'Save goal changes' : 'Create goal'}</Button></div>
          </form>
        </Card>
      )}
      <div className="page-action-bar"><span className="muted-copy">Review upcoming sessions to keep each target within reach.</span><Button appearance="primary" icon={<AddRegular />} onClick={() => { setForm(blankGoal); setEditingId(null); setValidation(''); setFormOpen(true); }}>Add goal</Button></div>
    </main>
  );
}