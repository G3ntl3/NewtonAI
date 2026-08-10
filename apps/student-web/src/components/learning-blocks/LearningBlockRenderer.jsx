import ChatBlock from './ChatBlock';
import QuizBlock from './QuizBlock';
import SimulationBlock from './SimulationBlock';
import SubjectSwitchBlock from './SubjectSwitchBlock';
import FormulaBlock from './FormulaBlock';

/**
 * LearningBlockRenderer
 * Single dispatch point: switches on block.type and renders the matching
 * *Block component (blueprint §4.2). New block types need a new folder here
 * + a registry entry + a schema addition in packages/types — nothing else.
 */
export default function LearningBlockRenderer({ block, onSave, isSaveOpen }) {
  switch (block.type) {
    case 'chat':
      return <ChatBlock payload={block.payload} onSave={onSave} isSaveOpen={isSaveOpen} />;
    case 'quiz':
      return <QuizBlock payload={block.payload} />;
    case 'simulation':
      return <SimulationBlock payload={block.payload} />;
    case 'subjectSwitch':
      return <SubjectSwitchBlock payload={block.payload} />;
    case 'formula':
      return <FormulaBlock payload={block.payload} />;
    default:
      return null;
  }
}
