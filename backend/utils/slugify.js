import slugifyPackage from 'slugify';

export default function createSlug(value) {
  return slugifyPackage(String(value || ''), {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true
  });
}
