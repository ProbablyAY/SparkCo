import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { MemoryCandidate } from '../lib/types';

export const MemoryPage = () => {
  const [memory, setMemory] = useState<MemoryCandidate[]>([]);

  useEffect(() => {
    api.get<{ memory: MemoryCandidate[] }>('/memory').then((r) => setMemory(r.data.memory));
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
    </div>
  );
};
