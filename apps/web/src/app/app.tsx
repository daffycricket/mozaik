import { BoardListPage } from './board-list-page';
import { BoardPage } from './board-page';
import type { Route } from './routes';

export const APP_NAME = 'Mozaik';

const DEFAULT_ROUTE: Route = { kind: 'board-list' };

export function App({ route = DEFAULT_ROUTE }: { route?: Route }) {
  if (route.kind === 'board') {
    return <BoardPage />;
  }
  return <BoardListPage />;
}
