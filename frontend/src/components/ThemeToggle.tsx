import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '../stores/themeStore';

const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-2"
      onClick={toggleTheme}
      aria-label={t('nav.toggleTheme')}
      title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
};

export default ThemeToggle;
