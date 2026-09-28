import type { TranslationTree } from '@framework/i18n';

/** Framework-owned copy. Brands override any key through their own resources. */
export const frameworkTranslations: Readonly<Record<string, TranslationTree>> = {
  en: {
    framework: {
      error: {
        title: 'Something went wrong',
        generic: 'Please try again in a moment.',
        offline: 'You appear to be offline.',
      },
      action: { retry: 'Try again', cancel: 'Cancel', ok: 'OK' },
    },
  },
  ar: {
    framework: {
      error: {
        title: 'حدث خطأ ما',
        generic: 'يرجى المحاولة مرة أخرى بعد قليل.',
        offline: 'يبدو أنك غير متصل.',
      },
      action: { retry: 'حاول مجددًا', cancel: 'إلغاء', ok: 'موافق' },
    },
  },
};
