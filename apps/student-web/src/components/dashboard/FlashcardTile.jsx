import Card from './Card';
import { CardsIcon } from './icons';

/** Small flashcard tile */
export default function FlashcardTile({ card }) {
  return (
    <Card className="p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-newton-blue-mid text-[9px] font-bold tracking-widest uppercase">
          {card.subject}
        </span>
        <CardsIcon className="w-3 h-3 text-newton-bg/35" />
      </div>
      <p className="text-newton-bg text-xs font-medium leading-snug flex-1 mb-2">
        {card.question}
      </p>
      <p className="text-newton-bg/40 text-[10px]">{card.dueLabel}</p>
    </Card>
  );
}
