/* Docs-page behaviour: keeps the sidebar in step with what is on screen. */

(() => {
  const links = [...document.querySelectorAll('.docs-nav a')];
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const sections = [...document.querySelectorAll('.docs-body section[id]')].filter((section) =>
    byId.has(section.id),
  );
  if (sections.length === 0) return;

  let current;

  function highlight(id) {
    if (id === current) return;
    byId.get(current)?.removeAttribute('aria-current');
    byId.get(id)?.setAttribute('aria-current', 'true');
    current = id;
  }

  // The topmost section still intersecting the viewport is the one being read.
  const observer = new IntersectionObserver(
    () => {
      const heading = sections.find((section) => section.getBoundingClientRect().bottom > 90);
      if (heading) highlight(heading.id);
    },
    { rootMargin: '-80px 0px 0px 0px', threshold: [0, 1] },
  );

  for (const section of sections) observer.observe(section);
})();
