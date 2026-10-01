import { SearchableCurrencyList } from '@/components/SearchableCurrencyList';
import type { CurrencyCode } from '@/types/currency';
import { PageHeader } from '../components/PageHeader';

interface CurrencyPickerPageProps {
  value: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  onBack: () => void;
}

export function CurrencyPickerPage({ value, onSelect, onBack }: CurrencyPickerPageProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Preferred currency" onBack={onBack} />
      <main className="px-3 pb-3">
        <SearchableCurrencyList value={value} onSelect={onSelect} autoFocus maxHeight={400} />
      </main>
    </div>
  );
}
