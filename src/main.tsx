import { render } from 'preact';
import { App } from './app';
import { loadAnalytics, registerServiceWorker } from './lib/platform';
import '@fontsource-variable/fraunces';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import './styles.css';

render(<App />, document.getElementById('app')!);
registerServiceWorker();
loadAnalytics();
