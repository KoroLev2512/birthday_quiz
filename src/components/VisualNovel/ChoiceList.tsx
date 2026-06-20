import type { SceneChoice } from '../../types/story';

type ChoiceListProps = {
  choices: SceneChoice[];
  onChoose: (choice: SceneChoice) => void;
  /** Label of the choice currently flagged as a wrong quiz answer (for the shake). */
  wrongLabel?: string | null;
  layout?: 'row' | 'column';
};

export function ChoiceList({ choices, onChoose, wrongLabel, layout = 'column' }: ChoiceListProps) {
  return (
    <div
      className={`vn-choices ${layout === 'row' ? 'vn-choices-row' : ''}`}
      data-testid="vn-choices"
    >
      {choices.map((choice) => {
        const isWrong = wrongLabel === choice.label;
        return (
          <button
            key={choice.nextSceneId ? choice.nextSceneId + choice.label : choice.label}
            type="button"
            className={`vn-choice-btn ${isWrong ? 'vn-choice-wrong' : ''}`}
            data-testid="vn-choice-btn"
            onClick={(event) => {
              event.stopPropagation();
              onChoose(choice);
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
