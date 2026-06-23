export const MARKET_CATEGORIES = [
  { value: 'lap_trinh', label: 'Lập trình' },
  { value: 'ai_ml', label: 'AI & Machine Learning' },
  { value: 'kinh_doanh', label: 'Kinh doanh' },
  { value: 'ngoai_ngu', label: 'Ngoại ngữ' },
  { value: 'toan_hoc', label: 'Toán học' },
  { value: 'y_hoc', label: 'Y học' },
  { value: 'khac', label: 'Khác' }
];

export const getCategoryLabel = (value: string | undefined): string => {
  if (!value) return '—';
  const category = MARKET_CATEGORIES.find(c => c.value === value);
  return category ? category.label : value;
};
