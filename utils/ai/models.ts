// Central place to control which models we use.
// Hierarchy: OPENAI_DEFAULT_MODEL > OPENAI_MODEL_<TYPE> > fallback

export type ModelType = 'articles' | 'keywords' | 'competitors' | 'niche' | 'products' | 'services';

function getModelForType(type: ModelType): string {
    // 1. Check for default model (used for everything if set)
    if (process.env.OPENAI_DEFAULT_MODEL) {
        return process.env.OPENAI_DEFAULT_MODEL;
    }

    // 2. Check for type-specific model
    const typeEnvVar = `OPENAI_MODEL_${type.toUpperCase()}`;
    if (process.env[typeEnvVar]) {
        return process.env[typeEnvVar];
    }

    // 3. Fallback to cheap model
    return 'gpt-4o-mini';
}

export const getArticleModel = () => getModelForType('articles');
export const getKeywordModel = () => getModelForType('keywords');
export const getCompetitorModel = () => getModelForType('competitors');
export const getNicheModel = () => getModelForType('niche');
export const getProductModel = () => getModelForType('products');
export const getServiceModel = () => getModelForType('services');

// Legacy export for backwards compatibility
export const CHEAP_TEXT_MODEL = getModelForType('articles');

