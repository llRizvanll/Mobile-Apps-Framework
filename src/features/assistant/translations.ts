export const en = {
  assistant: {
    tab: 'Assistant',
    title: 'Assistant',
    placeholder: 'Ask me to list or add tasks…',
    send: 'Send',
    error: 'The assistant is unavailable right now.',
    confirm: { title: 'Allow this action?', allow: 'Allow' },
  },
} as const;

export const ar = {
  assistant: {
    tab: 'المساعد',
    title: 'المساعد',
    placeholder: 'اطلب مني عرض المهام أو إضافتها…',
    send: 'إرسال',
    error: 'المساعد غير متاح الآن.',
    confirm: { title: 'السماح بهذا الإجراء؟', allow: 'سماح' },
  },
};

export type AssistantResources = typeof en;
