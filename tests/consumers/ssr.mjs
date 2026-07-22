const modules = await Promise.all([
  import('forgedialog/alert'),
  import('forgedialog/core'),
  import('forgedialog/interactions'),
  import('forgedialog/animations'),
]);

if (modules.some((module) => typeof module !== 'object')) process.exitCode = 1;
