import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PromptText from '@site/src/components/PromptText';

/**
 * <ExperimentArms>: the paragraph each arm of an experiment got, one tab per arm (or per wording).
 *
 *   <ExperimentArms
 *     control="neutral"
 *     arms={[
 *       {id: 'pessimist', label: 'Pessimist, wording 1', wording: 1, text: `A note on outlook: ...`},
 *       {id: 'neutral', label: 'Neutral, wording 1', wording: 1, text: `A note on outlook: ...`},
 *     ]}
 *   />
 *
 * When several entries share a label (the same arm in different wordings), each tab reads
 * "<label>, wording <n>".
 *
 * The control arm, with all of its wordings, always comes first, whatever order the post lists
 * them in; the rest keep the post's order. Each tab body is a <PromptText>, so the text wraps and
 * has a copy button. Tabs share groupId "arms", so picking an arm picks it in every arms block
 * on the page.
 *
 * make validate-experiment-design checks experiment posts use this instead of hand-written arm
 * <Tabs>.
 */
export interface ExperimentArmText {
  /** The arm's id, the same one ExperimentDesign's arms use. */
  id: string;
  /** The tab label, e.g. "Control" or "Neutral, wording 2". */
  label: string;
  /** The paragraph, exactly as the agent got it. */
  text: string;
  /** Which wording of this arm, when an arm has several. */
  wording?: number;
}

export interface ExperimentArmsProps {
  arms: ExperimentArmText[];
  control?: string;
  groupId?: string;
}

export default function ExperimentArms({arms = [], control, groupId = 'arms'}: ExperimentArmsProps): React.JSX.Element {
  const ordered = [...arms.filter((a) => a.id === control), ...arms.filter((a) => a.id !== control)];
  // Several wordings of one arm often share a label ("Pessimist"); tell their tabs apart.
  const shared = (label: string) => arms.filter((x) => x.label === label).length > 1;
  const tabLabel = (a: ExperimentArmText) =>
    a.wording && shared(a.label) && !/wording/i.test(a.label) ? `${a.label}, wording ${a.wording}` : a.label;
  return (
    <Tabs groupId={groupId}>
      {ordered.map((a) => {
        const value = `arm-${a.id}${a.wording ? `-${a.wording}` : ''}`;
        return (
          <TabItem key={value} value={value} label={tabLabel(a)}>
            <PromptText text={a.text} />
          </TabItem>
        );
      })}
    </Tabs>
  );
}
