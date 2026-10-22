import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokenCatalog } from './TokenCatalog'

const meta = {
  title: 'Foundations/Oxygen Reference Tokens',
  component: TokenCatalog,
  parameters: { controls: { disable: true }, layout: 'padded' },
} satisfies Meta<typeof TokenCatalog>

export default meta
type Story = StoryObj<typeof meta>
export const Catalog: Story = { name: 'Token catalog' }
