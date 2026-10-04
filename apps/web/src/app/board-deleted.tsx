import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { navigate } from './routes';

/**
 * Modal shown over the board when it has been deleted by another user. It
 * cannot be dismissed except by going back to the board list.
 */
export function BoardDeleted() {
  return (
    <AlertDialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
        }
      }}
    >
      <AlertDialogContent data-testid="board-deleted">
        <AlertDialogHeader>
          <AlertDialogTitle>Ce board a été supprimé</AlertDialogTitle>
          <AlertDialogDescription>
            Il n&apos;existe plus. Tu peux revenir au menu des boards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction data-testid="nav-boards" onClick={() => navigate('/')}>
            Retour aux boards
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
