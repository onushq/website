// Farming Labs Docs can load docs.config through jiti, which needs Node's module resolver
// and breaks in a Cloudflare Worker as soon as it is bundled. The site passes its config in
// (lib/docs.server.ts), so jiti is never used; astro.config.mjs aliases it to this stub.
// Some of its modules create an instance when they load, so creating one must not throw;
// using it does.
const unavailable = () => {
  throw new Error("jiti is not available in the Worker; pass the docs config in instead");
};
export const createJiti = () =>
  Object.assign(unavailable, { import: unavailable, esmResolve: unavailable, evalModule: unavailable });
export default createJiti;
