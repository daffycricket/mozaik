import { type BoardDoc, ELEMENTS_KEY, type Element, getElements } from '@mozaik/model';
import { useEffect, useState } from 'react';

/**
 * Subscribes to the elements of the board document and returns their current
 * valid state, re-rendering on local and remote changes.
 */
export function useElements(doc: BoardDoc | null): Element[] {
  const [elements, setElements] = useState<Element[]>(() => (doc === null ? [] : getElements(doc)));

  useEffect(() => {
    if (doc === null) {
      setElements([]);
      return;
    }
    const update = (): void => {
      setElements(getElements(doc));
    };
    update();
    const map = doc.getMap(ELEMENTS_KEY);
    map.observeDeep(update);
    return () => {
      map.unobserveDeep(update);
    };
  }, [doc]);

  return elements;
}
