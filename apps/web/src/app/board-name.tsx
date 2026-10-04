import { useState } from 'react';
import { nextBoardName } from '@/lib/boards-api';

type BoardNameProps = {
  name: string;
  onRename: (name: string) => void;
};

/**
 * Board name in the header: a button that turns into an input on click. Enter
 * validates the new name, Escape and losing focus keep the previous one.
 */
export function BoardName({ name, onRename }: BoardNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);

  function commit(): void {
    const target = nextBoardName(name, value);
    setIsEditing(false);
    if (target !== null) {
      onRename(target);
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        data-testid="board-name"
        className="h-7 max-w-[60%] truncate rounded px-1 font-semibold hover:bg-accent"
        onClick={() => {
          setValue(name);
          setIsEditing(true);
        }}
      >
        {name}
      </button>
    );
  }

  return (
    <input
      data-testid="board-name-input"
      aria-label="Nom du board"
      className="h-7 w-64 rounded border border-input bg-transparent px-1 font-semibold outline-none focus-visible:border-ring"
      // biome-ignore lint/a11y/noAutofocus: the field replaces the clicked name, focus must follow.
      autoFocus
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => setIsEditing(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setIsEditing(false);
        }
      }}
    />
  );
}
