import { useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { DICT } from '../lib/i18n.js';
import { haptic } from '../lib/telegram.js';

export default function Onboarding({ onFinish }) {
  const { user, patchUser } = useApp();
  const [lang, setLang] = useState(user?.language || 'ru');
  const [step, setStep] = useState(0);

  const dict = DICT[lang].onboarding;
  const slides = dict.slides;

  const next = async () => {
    haptic('light');
    if (step === 0) {
      await patchUser({ language: lang });
      setStep(1);
      return;
    }
    if (step <= slides.length - 1) {
      setStep(step + 1);
      return;
    }
    await patchUser({ onboarded: true, language: lang });
    onFinish();
  };

  if (step === 0) {
    return (
      <div className="onboarding">
        <div className="onboarding__body">
          <span className="onboarding__emoji">🌐</span>
          <h1 className="onboarding__title">{dict.langTitle}</h1>
        </div>
        <div className="lang-grid">
          <button className={`lang-btn ${lang === 'ru' ? 'lang-btn--active' : ''}`} onClick={() => setLang('ru')}>
            🇷🇺 Русский
          </button>
          <button className={`lang-btn ${lang === 'uz' ? 'lang-btn--active' : ''}`} onClick={() => setLang('uz')}>
            🇺🇿 O&apos;zbekcha
          </button>
        </div>
        <button className="btn btn--primary btn--block" onClick={next}>
          {dict.next}
        </button>
      </div>
    );
  }

  const slide = slides[step - 1];
  const isLast = step === slides.length;

  return (
    <div className="onboarding">
      <div className="onboarding__body">
        <span className="onboarding__emoji">{slide.emoji}</span>
        <h1 className="onboarding__title">{slide.title}</h1>
        <p className="onboarding__text">{slide.text}</p>
      </div>

      <div className="onboarding__dots">
        {slides.map((item, index) => (
          <span key={item.title} className={`dot ${index === step - 1 ? 'dot--active' : ''}`} />
        ))}
      </div>

      <button className="btn btn--primary btn--block" onClick={next}>
        {isLast ? dict.start : dict.next}
      </button>
    </div>
  );
}
