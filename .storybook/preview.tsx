import type { Preview } from '@storybook/react-vite'
import '../src/prototypes/data-grid/styles/data-grid.css'
import '../src/prototypes/data-grid/styles/icon-button-reference.css'

const preview: Preview = {
  decorators: [Story => <div className="dg-page cs01-reference"><Story /></div>],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    docs: { story: { inline: true } },
  },
}

export default preview
