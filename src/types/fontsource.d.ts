// Permite a TypeScript resolver importaciones de Fontsource y CSS sin tipos.
// Evita el error TS2307 cuando se usa `import "@fontsource/geist"`.
declare module "@fontsource/geist";
declare module "@fontsource/*";
declare module "*.css";