export default url => {
  const absoluteUrl = new URL(url, self.location).toString();
  // This is a bit of a hack; urlsToCacheKeys is defined in the global scope
  // within sw-precache's top-level service worker.
  return self.urlsToCacheKeys.get(absoluteUrl);
};
