import { SEO_LIMITS } from './limits';

export type ValidationStatus = 'pass' | 'warn' | 'fail' | 'na';

export type LengthValidation = {
  value: string;
  length: number;
  recommendedMin?: number;
  recommendedMax?: number;
  hardMax?: number;
  status: Exclude<ValidationStatus, 'na'>;
  message: string;
};

function normalize(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim();
}

function validateLength(
  valueRaw: unknown,
  opts: { recommendedMin?: number; recommendedMax?: number; hardMax?: number }
): LengthValidation {
  const value = normalize(valueRaw);
  const length = value.length;
  const { recommendedMin, recommendedMax, hardMax } = opts;

  if (hardMax !== undefined && length > hardMax) {
    return {
      value,
      length,
      recommendedMin,
      recommendedMax,
      hardMax,
      status: 'fail',
      message: `Too long: ${length}/${hardMax}.`,
    };
  }

  if (
    recommendedMin !== undefined &&
    recommendedMax !== undefined &&
    (length < recommendedMin || length > recommendedMax)
  ) {
    return {
      value,
      length,
      recommendedMin,
      recommendedMax,
      hardMax,
      status: 'warn',
      message: `Outside recommended range: ${length}/${recommendedMin}-${recommendedMax}.`,
    };
  }

  return {
    value,
    length,
    recommendedMin,
    recommendedMax,
    hardMax,
    status: 'pass',
    message: 'Within recommended range.',
  };
}

export function validateSeoMeta(meta: any) {
  const metaTitle = validateLength(meta?.title, SEO_LIMITS.metaTitle);
  const metaDescription = validateLength(meta?.description, SEO_LIMITS.metaDescription);
  const slug = validateLength(meta?.slug, { hardMax: SEO_LIMITS.urlSlug.hardMax });

  return { metaTitle, metaDescription, slug };
}


