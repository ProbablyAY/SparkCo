import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getApprovedMemory } from '../lib/clientData';
import type { MemoryCandidate } from '../lib/types';

export const MemoryPage = () => {
  const [memory, setMemory] = useState<MemoryCandidate[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    api
      .get<{ memory: MemoryCandidate[] }>('/memory')
      .then((r) => {
        setUsingFallback(false);
        setMemory(r.data.memory);
      })
      .catch(() => {
        setUsingFallback(true);
        setMemory(getApprovedMemory());
      });
  }, []);

  const grouped = useMemo(
    () =>
      memory.reduce((acc: Record<string, MemoryCandidate[]>, item) => {
        (acc[item.category] ||= []).push(item);
        return acc;
      }, {}),
    [memory]
  );

  return (
    <div>
      {usingFallback && <p className="text-sm text-amber-300 mb-2">Using local UI fallback data.</p>}
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <h2 className="text-xl capitalize">{cat}</h2>
          {items.map((i) => (
            <div key={i.id} className="border p-2 rounded my-2">
              {i.text}
            </div>
          ))}
        </section>
      ))}
      {memory.length === 0 && <p className="opacity-70">No approved memory yet.</p>}
    </div>
  );
};
