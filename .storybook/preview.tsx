import type { Preview } from '@storybook/react-vite'
import '../src/prototypes/data-grid/styles/data-grid.css'
import '../src/prototypes/data-grid/styles/icon-button-reference.css'
import '../stories/cs-02/tooltip-reference.css'
import '../stories/docs-reference.css'

const preview: Preview = {
  decorators: [(Story, context) => context.title.startsWith('Foundations/') ? <Story /> : <div className={`dg-page ${context.title.startsWith('CS-03/') ? 'cs03-reference' : context.title.startsWith('CS-02/') ? 'cs02-reference' : 'cs01-reference'}`}><Story /></div>],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    docs: { story: { inline: true } },
  },
}

export default preview
