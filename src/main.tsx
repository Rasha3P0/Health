import { render } from 'preact';
import { App } from './app';
import { loadAnalytics, registerServiceWorker } from './lib/platform';
import './styles.css';

render(<App />, document.getElementById('app')!);
registerServiceWorker();
loadAnalytics();
