import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Board } from '@/lib/boards-api';

type DeleteBoardDialogProps = {
  board: Board;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmation dialog for a definitive board deletion. Escape cancels it.
 */
export function DeleteBoardDialog({ board, onCancel, onConfirm }: DeleteBoardDialogProps) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid="delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {board.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="delete-cancel" onClick={onCancel}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogClose
            render={
              <Button variant="destructive" data-testid="delete-confirm" onClick={onConfirm} />
            }
          >
            Supprimer
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
