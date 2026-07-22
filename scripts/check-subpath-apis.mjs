import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const entries = [
  'alert',
  'confirm',
  'prompt',
  'core',
  'interactions',
  'animations',
  'presentation',
  'workflows',
];
let failed = false;
for (const entry of entries) {
  const config = ExtractorConfig.prepare({
    configObject: {
      projectFolder: process.cwd(),
      mainEntryPointFilePath: `<projectFolder>/dist/${entry}.d.ts`,
      compiler: { tsconfigFilePath: '<projectFolder>/tsconfig.json' },
      apiReport: {
        enabled: true,
        reportFileName: `${entry}.api.md`,
        reportFolder: '<projectFolder>/etc',
        reportTempFolder: '<projectFolder>/temp',
      },
      docModel: { enabled: false },
      dtsRollup: { enabled: false },
      tsdocMetadata: { enabled: false },
      messages: {
        extractorMessageReporting: {
          default: { logLevel: 'warning' },
          'ae-missing-release-tag': { logLevel: 'none' },
          'ae-undocumented': { logLevel: 'none' },
          'ae-forgotten-export': { logLevel: 'none' },
        },
      },
    },
    configObjectFullPath: `${process.cwd()}/api-extractor.json`,
    packageJsonFullPath: `${process.cwd()}/package.json`,
  });
  const result = Extractor.invoke(config, {
    localBuild: process.argv.includes('--local'),
    showVerboseMessages: false,
  });
  failed ||= !result.succeeded;
}
if (failed) process.exitCode = 1;
