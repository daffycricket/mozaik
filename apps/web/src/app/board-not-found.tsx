import { Button } from '@/components/ui/button';
import { navigate } from './routes';

/**
 * Error page shown when the board of the current URL does not exist.
 */
export function BoardNotFound() {
  return (
    <main
      data-testid="board-not-found"
      className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-lg font-semibold">Board introuvable</h1>
      <p className="text-muted-foreground">Ce board n&apos;existe pas ou a été supprimé.</p>
      <Button type="button" data-testid="nav-boards" onClick={() => navigate('/')}>
        Retour aux boards
      </Button>
    </main>
  );
}
