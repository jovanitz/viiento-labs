/**
 * "Add entry" modal — pick a Template and it attaches immediately, blank,
 * to the client's timeline (closes the dialog). Filling it in happens
 * inline on the timeline itself via that entry's Edit button — see
 * timeline.entry.tsx — never a second modal step. Managing/building
 * templates lives in its own place — see client/templates/, reached from
 * its own nav item — this picker just consumes the library.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@acme/ui';
import type { EntryTemplate } from '../../../../templates/templates.types';
import { TemplatePickerPickStep } from './template-picker.pick-step';

export const TemplatePickerDialog = ({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly templates: readonly EntryTemplate[];
  readonly onSelectTemplate: (template: EntryTemplate) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add entry</DialogTitle>
      </DialogHeader>
      <TemplatePickerPickStep
        templates={templates}
        onSelect={onSelectTemplate}
      />
    </DialogContent>
  </Dialog>
);
