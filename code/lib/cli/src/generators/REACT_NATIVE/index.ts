import { copyTemplateFiles, getBabelDependencies } from '../../helpers';
import type { JsPackageManager } from '../../js-package-manager';
import type { NpmOptions } from '../../NpmOptions';
import { SupportedLanguage } from '../../project_types';

const generator = async (
  packageManager: JsPackageManager,
  npmOptions: NpmOptions
): Promise<void> => {
  const packageJson = packageManager.retrievePackageJson();

  const missingReactDom =
    !packageJson.dependencies['react-dom'] && !packageJson.devDependencies['react-dom'];
  const reactVersion = packageJson.dependencies.react;

  const packagesToResolve = [
    // addon-ondevice-controls peer deps
    'react-native-safe-area-context',
    '@react-native-async-storage/async-storage',
    '@react-native-community/datetimepicker',
    '@react-native-community/slider',
  ];

  // change these to latest version once v6 stable is released
  const packagesWithFixedVersion = [
    '@storybook/addon-actions@^6.5.14',
    '@storybook/addon-controls@^6.5.14',
    '@storybook/addon-ondevice-controls@6.5.0-rc.0',
    '@storybook/addon-ondevice-actions@6.5.0-rc.0',
    '@storybook/react-native@6.5.0-rc.0',
  ];

  const resolvedPackages = await packageManager.getVersionedPackages(packagesToResolve);

  const babelDependencies = await getBabelDependencies(packageManager, packageJson);

  const packages = [
    ...babelDependencies,
    ...packagesWithFixedVersion,
    ...resolvedPackages,
    missingReactDom && reactVersion && `react-dom@${reactVersion}`,
  ].filter(Boolean);

  packageManager.addDependencies({ ...npmOptions, packageJson }, packages);
  packageManager.addScripts({
    'storybook-generate': 'sb-rn-get-stories',
    'storybook-watch': 'sb-rn-watcher',
  });

  const storybookConfigFolder = '.storybook';

  await copyTemplateFiles({
    renderer: 'react-native',
    language: SupportedLanguage.JAVASCRIPT,
    destination: storybookConfigFolder,
    includeCommonAssets: false,
  });
};

export default generator;
