import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
};

export default function DatePickerFilter({ dateFrom, dateTo, onChange }: Props) {
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo, setLocalTo] = useState(dateTo);

  const presets = [
    { label: 'Hôm nay', getRange: () => { const d = new Date(); const s = d.toISOString().split('T')[0]; return [s, s]; } },
    { label: 'Ngày mai', getRange: () => { const d = new Date(); d.setDate(d.getDate() + 1); const s = d.toISOString().split('T')[0]; return [s, s]; } },
    { label: 'Tuần này', getRange: () => { 
        const d = new Date(); 
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const start = new Date(d.setDate(diff));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]; 
      } 
    },
    { label: 'Cuối tuần này', getRange: () => { 
        const d = new Date(); 
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const sat = new Date(d.setDate(diff + 5));
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        return [sat.toISOString().split('T')[0], sun.toISOString().split('T')[0]]; 
      } 
    },
  ];

  const handleApply = () => {
    onChange(localFrom, localTo);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {presets.map(p => (
          <Button 
            key={p.label} 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const [f, t] = p.getRange();
              setLocalFrom(f);
              setLocalTo(t);
              onChange(f, t);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <Input type="date" value={localFrom} onChange={e => setLocalFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <Input type="date" value={localTo} onChange={e => setLocalTo(e.target.value)} />
        </div>
      </div>
      <Button className="w-full" onClick={handleApply}>Áp dụng ngày</Button>
    </div>
  );
}
