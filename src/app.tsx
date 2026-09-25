import { useEffect, useState } from 'preact/hooks';
import { Footer, Header, Nav, type Route } from './components/chrome';
import { More } from './screens/More';
import { Prep } from './screens/Prep';
import { Record } from './screens/Record';
import { Today } from './screens/Today';
import { Welcome } from './screens/Welcome';
import { StoreProvider, useStore } from './store';

const ROUTES: Route[] = ['today', 'prep', 'record', 'more'];

function readRoute(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'today';
}

function Shell() {
  const { snap } = useStore();
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const on = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (!snap.settings.onboarded) return <Welcome />;

  return (
    <>
      <Header />
      {route === 'today' && <Today />}
      {route === 'prep' && <Prep />}
      {route === 'record' && <Record />}
      {route === 'more' && <More />}
      <Footer />
      <Nav route={route} />
    </>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
