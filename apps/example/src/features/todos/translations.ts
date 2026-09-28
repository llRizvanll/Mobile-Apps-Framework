export const en = {
  todos: {
    title: 'My tasks',
    remaining: { one: '{{count}} task left', other: '{{count}} tasks left', zero: 'All done 🎉' },
    placeholder: 'What needs doing?',
    add: 'Add',
    empty: { title: 'Nothing here yet', message: 'Add your first task above.' },
    errors: {
      generic: 'Could not load tasks.',
      titleRequired: 'Please enter a title.',
      titleTooLong: 'That title is too long.',
    },
  },
} as const;

type Shape<T> = { readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

export const ar: Shape<typeof en> = {
  todos: {
    title: 'مهامي',
    remaining: { one: 'مهمة واحدة متبقية', other: '{{count}} مهام متبقية', zero: 'تم كل شيء 🎉' },
    placeholder: 'ما الذي يجب إنجازه؟',
    add: 'إضافة',
    empty: { title: 'لا شيء هنا بعد', message: 'أضف مهمتك الأولى أعلاه.' },
    errors: {
      generic: 'تعذر تحميل المهام.',
      titleRequired: 'يرجى إدخال عنوان.',
      titleTooLong: 'العنوان طويل جدًا.',
    },
  },
};

export const fr: Shape<typeof en> = {
  todos: {
    title: 'Mes tâches',
    remaining: {
      one: '{{count}} tâche restante',
      other: '{{count}} tâches restantes',
      zero: 'Tout est fait 🎉',
    },
    placeholder: 'Que faut-il faire ?',
    add: 'Ajouter',
    empty: { title: 'Rien pour le moment', message: 'Ajoutez votre première tâche ci-dessus.' },
    errors: {
      generic: 'Impossible de charger les tâches.',
      titleRequired: 'Veuillez saisir un titre.',
      titleTooLong: 'Ce titre est trop long.',
    },
  },
};

export type TodosResources = typeof en;
