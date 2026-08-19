/**
 * Section navigation: Templates and Formats are sibling collections of the
 * same module (the forms, and the wrappers they print in), so they read as
 * tabs — parallel places you switch between — rather than a button that
 * looks like an action.
 */
import { Tabs, TabsList, TabsTrigger } from '@acme/ui';

export type TemplatesTab = 'templates' | 'formats';

export const TemplatesSectionTabs = ({
  active,
  onChange,
}: {
  readonly active: TemplatesTab;
  readonly onChange: (tab: TemplatesTab) => void;
}) => (
  <Tabs value={active} onValueChange={(v) => onChange(v as TemplatesTab)}>
    <TabsList>
      <TabsTrigger value="templates">Templates</TabsTrigger>
      <TabsTrigger value="formats">Formats</TabsTrigger>
    </TabsList>
  </Tabs>
);
