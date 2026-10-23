import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/cs-01/*.stories.tsx', '../stories/cs-01/*.mdx', '../stories/cs-02/*.stories.tsx', '../stories/cs-02/*.mdx', '../stories/cs-03/*.stories.tsx', '../stories/cs-03/*.mdx', '../stories/cs-04/*.stories.tsx', '../stories/cs-04/*.mdx', '../stories/foundations/*.stories.tsx', '../stories/foundations/*.mdx'],
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
