import { ClientHomeScreen, RequireSession } from '@acme/lab-ui';

/**
 * The client's only route, lazy-loaded as its own chunk. `RequireSession` shows
 * login (with signup) until authenticated, then the home screen.
 */
const HomeRoute = () => (
  <RequireSession>
    <ClientHomeScreen />
  </RequireSession>
);

export default HomeRoute;
