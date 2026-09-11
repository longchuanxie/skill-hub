import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  viewMode: 'card' | 'list';
  onChange: (mode: 'card' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('card')}
        className={cn(
          'flex items-center justify-center p-2.5 transition-all duration-200',
          viewMode === 'card'
            ? 'bg-black text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black'
        )}
        title={t('myResources.gridView')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'flex items-center justify-center p-2.5 transition-all duration-200',
          viewMode === 'list'
            ? 'bg-black text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black'
        )}
        title={t('myResources.listView')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
};

export default ViewToggle;
