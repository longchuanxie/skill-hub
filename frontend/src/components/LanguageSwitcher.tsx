import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../stores/languageStore';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setLanguage } = useLanguageStore();

  const handleChange = (lang: 'en' | 'zh') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={i18n.language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('en')}
        className="px-2"
      >
        EN
      </Button>
      <Button
        variant={i18n.language === 'zh' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('zh')}
        className="px-2"
      >
        中文
      </Button>
    </div>
  );
}
