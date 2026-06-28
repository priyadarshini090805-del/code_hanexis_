'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface WorkflowStep {
  id: string;
  type: string;
  stepNumber: number;
  content?: Record<string, any>;
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

function WorkflowBuilderPage() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStepType, setNewStepType] = useState('MESSAGE');
  const [stepContent, setStepContent] = useState<Record<string, any>>({
    message: '',
    delayMs: 0,
    condition: '',
  });

  useEffect(() => {
    if (workflowId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchWorkflow();
    }
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}`, {
      });

      if (!response.ok) throw new Error('Workflow not found');
      const data = await response.json();
      setWorkflow(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addStep = async () => {
    if (!workflowId) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newStepType,
          stepNumber: (workflow?.steps.length || 0) + 1,
          content: stepContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to add step');
      await fetchWorkflow();
      setStepContent({ message: '', delayMs: 0, condition: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteStep = async (stepId: string) => {
    if (!workflowId) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}/steps/${stepId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete step');
      await fetchWorkflow();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Loading workflow...</div>;
  }

  if (!workflow) {
    return <div className="p-8 text-center text-[var(--hx-text-secondary)]">Workflow not found</div>;
  }

  const stepTypeOptions = [
    { value: 'MESSAGE', label: 'Send Message' },
    { value: 'DELAY', label: 'Wait/Delay' },
    { value: 'CONDITION', label: 'Conditional Branch' },
    { value: 'BRANCH', label: 'Split Path' },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--hx-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--hx-text)]">Workflow Builder</h1>
          <Link href={`/dashboard/workflows/${workflowId}`} className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)]">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-[var(--hx-surface-secondary)] border border-[var(--hx-border)] rounded-lg mb-6">
            <p className="text-[var(--hx-text)]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="border border-[var(--hx-border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--hx-text)] mb-4">{workflow.name}</h2>
              <div className="space-y-3">
                {workflow.steps.length === 0 ? (
                  <p className="text-[var(--hx-text-secondary)] text-center py-8">No steps added yet</p>
                ) : (
                  workflow.steps.map((step) => (
                    <div key={step.id} className="border border-[var(--hx-border)] rounded-lg p-4 bg-[var(--hx-surface-secondary)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--hx-text)]">Step {step.stepNumber}: {step.type}</p>
                          {step.type === 'MESSAGE' && (
                            <p className="text-sm text-[var(--hx-text-secondary)] mt-2">{step.content?.message}</p>
                          )}
                          {step.type === 'DELAY' && (
                            <p className="text-sm text-[var(--hx-text-secondary)] mt-2">Wait {step.content?.delayMs / 1000} seconds</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="text-[var(--hx-text-secondary)] hover:text-[var(--hx-text)] text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-[var(--hx-surface-secondary)] rounded-lg p-6 sticky top-8">
              <h3 className="font-semibold text-[var(--hx-text)] mb-4">Add Step</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Step Type</label>
                  <select
                    value={newStepType}
                    onChange={e => setNewStepType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
                  >
                    {stepTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {newStepType === 'MESSAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Message</label>
                    <textarea
                      value={stepContent.message}
                      onChange={e => setStepContent({ ...stepContent, message: e.target.value })}
                      placeholder="Enter message text..."
                      rows={4}
                      className="w-full px-3 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
                    />
                    <p className="text-xs text-[var(--hx-text-secondary)] mt-2">{'Use {{firstName}}, {{lastName}}, {{company}} for variables'}</p>
                  </div>
                )}

                {newStepType === 'DELAY' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--hx-text)] mb-2">Delay (seconds)</label>
                    <input
                      type="number"
                      value={stepContent.delayMs / 1000}
                      onChange={e => setStepContent({ ...stepContent, delayMs: parseInt(e.target.value) * 1000 })}
                      placeholder="60"
                      className="w-full px-3 py-2 border border-[var(--hx-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hx-brand)]"
                    />
                  </div>
                )}

                <button
                  onClick={addStep}
                  disabled={!stepContent.message && newStepType === 'MESSAGE'}
                  className="w-full px-4 py-2 hx-btn-primary rounded-lg hover:bg-[var(--hx-brand-light)] disabled:opacity-50"
                >
                  Add Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--hx-text-secondary)]">Loading…</div>}>
      <WorkflowBuilderPage />
    </Suspense>
  )
}
