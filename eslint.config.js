// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

// JJ-Sprint2 11/10/2026: reglas de arquitectura (vertical slices + clean architecture) que `npm run lint` hace cumplir.
// Las features se detectan solas: crear src/app/features/<nombre>/ basta para que sus reglas apliquen.
const FEATURES_DIR = path.join(__dirname, 'src/app/features');
const features = fs.existsSync(FEATURES_DIR)
  ? fs
      .readdirSync(FEATURES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

const NO_DEEP_RELATIVE = {
  regex: '^\\.\\./\\.\\./',
  message: 'Usa los alias (@core, @shared, @shell, @features/...) en lugar de rutas ../../',
};

/** Desde fuera de una feature solo se usa su API pública: `@features/<f>` (index.ts) o `@features/<f>/<f>.routes`. */
const ONLY_PUBLIC_API = {
  regex: '^@features/([^/]+)/(?!\\1\\.routes$).+',
  message: 'Fuera de una feature importa solo su API pública: @features/<feature> (index.ts)',
};

/** Dentro de la feature `f`, prohíbe tocar el interior de otras features. */
const otherFeaturesInternals = (f) => ({
  regex: `^@features/(?!${f}/)([^/]+)/(?!\\1\\.routes$).+`,
  message: 'Una feature no importa el interior de otra; usa su API pública @features/<feature>',
});

const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [NO_DEEP_RELATIVE, ...patterns] }],
});

/** Una entrada de config por capa de cada feature (en flat config la última que aplica gana). */
const featureLayerRules = features.flatMap((f) => {
  const base = `src/app/features/${f}`;
  const own = `@features/${f}`;
  return [
    // Raíz de la feature (index.ts, <f>.routes.ts, <f>.providers.ts): punto de composición, puede usar todas sus capas
    { files: [`${base}/*.ts`], rules: restrict(otherFeaturesInternals(f)) },
    {
      files: [`${base}/domain/**/*.ts`],
      rules: restrict(
        { regex: '^@angular/', message: 'domain es TypeScript puro: sin Angular' },
        { regex: '^@(core|shared|shell)/', message: 'domain no depende de core/shared/shell' },
        { regex: `^@features/(?!${f}/domain/)`, message: 'domain solo importa su propio domain' },
      ),
    },
    {
      files: [`${base}/data/**/*.ts`],
      rules: restrict(
        otherFeaturesInternals(f),
        { regex: `^${own}/(application|presentation)/`, message: 'data implementa domain; no conoce application ni presentation' },
        { regex: '^@shell/', message: 'data no depende del shell' },
      ),
    },
    {
      files: [`${base}/application/**/*.ts`],
      rules: restrict(
        otherFeaturesInternals(f),
        { regex: `^${own}/(data|presentation)/`, message: 'application usa los contratos de domain, nunca data ni presentation' },
        { regex: '^@angular/common/http', message: 'application no usa HttpClient; eso es de data' },
        { regex: '^@shell/', message: 'application no depende del shell' },
      ),
    },
    {
      files: [`${base}/presentation/**/*.ts`],
      rules: restrict(
        otherFeaturesInternals(f),
        { regex: `^${own}/data/`, message: 'presentation habla con su facade (application), nunca con data' },
        { regex: '^@angular/common/http', message: 'presentation no hace HTTP; usa la facade' },
        { regex: '^@core/http/(?!api-error$)', message: 'presentation no usa el cliente HTTP; usa la facade' },
      ),
    },
  ];
});

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      ...restrict(ONLY_PUBLIC_API),
    },
  },
  {
    files: ['src/app/core/**/*.ts', 'src/app/shared/**/*.ts'],
    rules: restrict({
      regex: '^@(features|shell)(/|$)',
      message: 'core y shared son la base: no conocen features ni el shell',
    }),
  },
  ...featureLayerRules,
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
