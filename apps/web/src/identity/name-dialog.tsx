import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateName } from './identity';

type NameDialogProps = {
  onSubmit: (name: string) => void;
  onBack: () => void;
};

/**
 * Asks for the user name before entering a board. It cannot be dismissed:
 * the user either validates a name or goes back to the board list.
 */
export function NameDialog({ onSubmit, onBack }: NameDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(): void {
    const result = validateName(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSubmit(result.name);
  }

  return (
    <Dialog
      open
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
        }
      }}
    >
      <DialogContent data-testid="name-dialog" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Comment t'appelles-tu ?</DialogTitle>
          <DialogDescription>Ton nom sera visible des autres participants.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name-input" className="sr-only">
            Ton nom
          </Label>
          <Input
            id="name-input"
            data-testid="name-input"
            value={value}
            aria-invalid={error !== null}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
          {error !== null && (
            <p data-testid="name-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="link" data-testid="name-back" onClick={onBack}>
            Retour aux boards
          </Button>
          <Button type="button" data-testid="name-submit" onClick={submit}>
            Entrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
