import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/supabase.ts'],
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  // Let TypeScript handle declaration files separately
  dts: false,
  treeshake: true,
}); 