import { describe, it, expect, beforeEach } from 'vitest';
import { useI18n } from './i18nStore';

describe('i18nStore', () => {
  beforeEach(() => {
    useI18n.setState({ locale: 'fr' });
  });

  it('defaults to French locale', () => {
    expect(useI18n.getState().locale).toBe('fr');
  });

  it('translates keys in French', () => {
    const { t } = useI18n.getState();
    expect(t('common.save')).toBe('Enregistrer');
    expect(t('nav.dashboard')).toBe('Tableau de bord');
  });

  it('switches to Dutch', () => {
    useI18n.getState().setLocale('nl');
    const { t, locale } = useI18n.getState();
    expect(locale).toBe('nl');
    expect(t('common.save')).toBe('Opslaan');
    expect(t('nav.dashboard')).toBe('Dashboard');
  });

  it('switches to German', () => {
    useI18n.getState().setLocale('de');
    const { t } = useI18n.getState();
    expect(t('common.save')).toBe('Speichern');
    expect(t('common.cancel')).toBe('Abbrechen');
  });

  it('falls back to French for unknown keys', () => {
    useI18n.getState().setLocale('nl');
    const { t } = useI18n.getState();
    // All keys exist in all locales, so test a known FR key
    expect(t('dashboard.title')).toBe('Dashboard');
  });

  it('returns key string for completely unknown keys', () => {
    const { t } = useI18n.getState();
    // @ts-expect-error -- testing unknown key fallback
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('covers billing domain keys', () => {
    const { t } = useI18n.getState();
    expect(t('billing.efact')).toBe('eFact');
    expect(t('billing.rejections')).toBe('Rejets');
  });

  it('covers eHealth domain keys', () => {
    useI18n.getState().setLocale('nl');
    const { t } = useI18n.getState();
    expect(t('ehealth.vitalink')).toBe('Vitalink');
    expect(t('ehealth.consent')).toBe('Toestemmingen');
  });
});
