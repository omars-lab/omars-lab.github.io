import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './Catalog.module.css';
import projectsData from '@site/src/components/ProjectsCatalog/projects-data.json';
import tinkeringData from '@site/src/components/TinkeringCatalog/tinkering-data.json';
import researchData from '@site/src/components/ResearchCatalog/research-data.json';
import promptsData from '@site/src/components/PromptsCatalog/prompts-data.json';
import patternsData from '@site/src/components/PatternsCatalog/patterns-data.json';
import techniquesData from '@site/src/components/TechniquesCatalog/techniques-data.json';

/**
 * Catalog — the generic durable HUB index. Renders one hub's data (grouped by area) as
 * area sections of cards. Which hub is chosen by the `kind` prop:
 *   <Catalog kind="project" />   -> Projects hub    (project logs, /initiatives)
 *   <Catalog kind="tinkering" /> -> Tinkering hub   (tinkering logs, /initiatives)
 *   <Catalog kind="research" />  -> Research hub     (learning/research logs, /initiatives)
 *   <Catalog kind="pattern" />   -> Patterns hub     (durable /craft architecture docs)
 *   <Catalog kind="technique" /> -> Techniques hub   (durable /craft how-to docs)
 *
 * The data is generated per hub by scripts/generate-hubs-data.js (from posts/docs carrying
 * that `kind:` + an `area:`), so a hub can never drift from the entries it indexes. Cards
 * show the entry's theme tags as chips.
 *
 * PUBLISHED entries link to their page; DRAFT entries render muted with an "in progress"
 * badge and NO link (a link to a draft 404s in the prod build).
 */

interface Entry {
  slug: string;
  title: string;
  description: string;
  permalink: string;
  date: string;
  draft: boolean;
  tags: string[];
}
type HubData = Record<string, Entry[]>;

// Per-hub data + reader-facing intro. Keys of DATA match generate-hubs-data.js HUBS ids.
const DATA: Record<string, HubData> = {
  project: projectsData as HubData,
  tinkering: tinkeringData as HubData,
  research: researchData as HubData,
  prompt: promptsData as HubData,
  pattern: patternsData as HubData,
  technique: techniquesData as HubData,
};

// Reader-facing labels + order for the areas (shared across hubs). Keys must match the
// `areas` in generate-hubs-data.js.
const AREA_META: {key: string; label: string; blurb: string}[] = [
  {key: 'frontend', label: 'Frontend', blurb: 'Sites, apps, and visual tools.'},
  {key: 'backend', label: 'Backend', blurb: 'Services, infrastructure, and automation behind the scenes.'},
  {key: 'script', label: 'Scripting', blurb: 'Command-line tools and scripts that automate the small things.'},
  {key: 'plugin', label: 'Plugins', blurb: 'Editor, browser, and workspace extensions.'},
  {key: 'other', label: 'Other', blurb: 'Everything that does not fit a single area.'},
];

function EntryCard({entry}: {entry: Entry}): React.JSX.Element {
  const body = (
    <>
      <span className={styles.cardTitle}>{entry.title}</span>
      {entry.description && <span className={styles.cardDesc}>{entry.description}</span>}
      {entry.tags.length > 0 && (
        <span className={styles.tags}>
          {entry.tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              {tag}
            </span>
          ))}
        </span>
      )}
      <span className={styles.cardMeta}>
        {entry.draft && <span className={styles.draftBadge}>in progress</span>}
        {entry.date && <span className={styles.date}>{entry.date}</span>}
      </span>
    </>
  );

  // A draft has no published URL — render it as a non-linked, muted card.
  if (entry.draft) {
    return <li className={clsx(styles.card, styles.cardDraft)}>{body}</li>;
  }
  return (
    <li className={styles.card}>
      <Link className={styles.cardLink} to={entry.permalink}>
        {body}
      </Link>
    </li>
  );
}

export default function Catalog({kind}: {kind: string}): React.JSX.Element {
  const hub = DATA[kind];
  if (!hub) {
    return <p className={styles.empty}>Unknown hub kind: {kind}</p>;
  }
  const areas = AREA_META.filter((a) => (hub[a.key] || []).length > 0);
  if (areas.length === 0) {
    return <p className={styles.empty}>Nothing catalogued here yet.</p>;
  }

  return (
    <div className={styles.catalog}>
      {areas.map((area) => {
        const entries = hub[area.key] || [];
        return (
          <section key={area.key} className={styles.area}>
            <h2 className={styles.areaTitle}>
              {area.label}
              <span className={styles.areaCount}>{entries.length}</span>
            </h2>
            <p className={styles.areaBlurb}>{area.blurb}</p>
            <ul className={styles.grid}>
              {entries.map((e) => (
                <EntryCard key={e.slug} entry={e} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
