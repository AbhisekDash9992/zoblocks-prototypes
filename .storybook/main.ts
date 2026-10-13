import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/cs-01/*.stories.tsx', '../stories/cs-01/*.mdx'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  // No private/static directory mounts. Referenced assets are bundled explicitly.
  staticDirs: [],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    // Override only Storybook's preview config; leave the application's base intact.
    return { ...config, base: './', publicDir: false }
  },
}

export default config
