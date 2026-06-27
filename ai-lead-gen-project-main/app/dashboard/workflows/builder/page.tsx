'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
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
      const token = 'cookie';
      const response = await fetch(`/api/workflows/${workflowId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = 'cookie';
      const response = await fetch(`/api/workflows/${workflowId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const token = 'cookie';
      const response = await fetch(`/api/workflows/${workflowId}/steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete step');
      await fetchWorkflow();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading workflow...</div>;
  }

  if (!workflow) {
    return <div className="p-8 text-center text-neutral-600">Workflow not found</div>;
  }

  const stepTypeOptions = [
    { value: 'MESSAGE', label: 'Send Message' },
    { value: 'DELAY', label: 'Wait/Delay' },
    { value: 'CONDITION', label: 'Conditional Branch' },
    { value: 'BRANCH', label: 'Split Path' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Workflow Builder</h1>
          <Link href={`/dashboard/workflows/${workflowId}`} className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-4">{workflow.name}</h2>
              <div className="space-y-3">
                {workflow.steps.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No steps added yet</p>
                ) : (
                  workflow.steps.map((step, idx) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-black">Step {step.stepNumber}: {step.type}</p>
                          {step.type === 'MESSAGE' && (
                            <p className="text-sm text-gray-600 mt-2">{step.content?.message}</p>
                          )}
                          {step.type === 'DELAY' && (
                            <p className="text-sm text-gray-600 mt-2">Wait {step.content?.delayMs / 1000} seconds</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="text-neutral-600 hover:text-neutral-800 text-sm"
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
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h3 className="font-semibold text-black mb-4">Add Step</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Step Type</label>
                  <select
                    value={newStepType}
                    onChange={e => setNewStepType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                    <label className="block text-sm font-medium text-black mb-2">Message</label>
                    <textarea
                      value={stepContent.message}
                      onChange={e => setStepContent({ ...stepContent, message: e.target.value })}
                      placeholder="Enter message text..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <p className="text-xs text-gray-500 mt-2">Use {{firstName}}, {{lastName}}, {{company}} for variables</p>
                  </div>
                )}

                {newStepType === 'DELAY' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Delay (seconds)</label>
                    <input
                      type="number"
                      value={stepContent.delayMs / 1000}
                      onChange={e => setStepContent({ ...stepContent, delayMs: parseInt(e.target.value) * 1000 })}
                      placeholder="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}

                <button
                  onClick={addStep}
                  disabled={!stepContent.message && newStepType === 'MESSAGE'}
                  className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
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
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <WorkflowBuilderPage />
    </Suspense>
  )
}
