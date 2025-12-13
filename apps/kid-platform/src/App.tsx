import React from 'react';
import { Typography } from './components/ui/typography';
import { BigButton } from './components/kid-friendly/BigButton';
import { useI18n } from './lib/i18n';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Typography tag="h1" variant="title" size="3xl" weight="bold" colorful>
          {t('student.welcome.title')}
        </Typography>
        <Typography tag="p" variant="subtitle" size="lg" className="mt-4">
          {t('student.welcome.subtitle')}
        </Typography>
        <div className="mt-8">
          <BigButton icon={BookOpen} iconPosition="left">
            {t('student.welcome.startButton')}
          </BigButton>
        </div>
      </div>
    </div>
  );
};

export default App;

