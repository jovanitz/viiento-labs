/**
 * Settings · Notifications + Appearance. Notifications are PERSONAL
 * ("tell me when…"), not client-facing reminder policy — that, like all
 * business configuration, belongs to the organization admin's account.
 * Appearance applies for real (the `.dark` class the theme tokens key
 * off), but only when the user picks — it never overrides the host's
 * theme on mount.
 */
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from '@acme/ui';
import type { NotificationPrefs, ThemeChoice } from './settings.types';

const PREF_ROWS: ReadonlyArray<{
  readonly key: keyof NotificationPrefs;
  readonly label: string;
  readonly description: string;
}> = [
  {
    key: 'newBooking',
    label: 'New booking',
    description: 'When a client books an appointment.',
  },
  {
    key: 'cancellation',
    label: 'Cancellation',
    description: 'When a client cancels an appointment.',
  },
  {
    key: 'dailySummary',
    label: 'Daily agenda summary',
    description: 'Each morning, the day ahead at a glance.',
  },
];

export const NotificationsCard = ({
  prefs,
  onToggle,
}: {
  readonly prefs: NotificationPrefs;
  readonly onToggle: (key: keyof NotificationPrefs, value: boolean) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Notifications</CardTitle>
      <CardDescription>What you get notified about.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {PREF_ROWS.map(({ key, label, description }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor={`pref-${key}`}>{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Switch
            id={`pref-${key}`}
            checked={prefs[key]}
            onCheckedChange={(value) => onToggle(key, value)}
          />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const AppearanceCard = ({
  theme,
  onThemeChange,
}: {
  readonly theme: ThemeChoice;
  readonly onThemeChange: (theme: ThemeChoice) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>Theme for this device.</CardDescription>
    </CardHeader>
    <CardContent>
      <ToggleGroup
        type="single"
        variant="outline"
        value={theme}
        onValueChange={(value) => {
          if (value) onThemeChange(value as ThemeChoice);
        }}
        className="justify-start"
      >
        <ToggleGroupItem value="light" aria-label="Light theme">
          <Sun /> Light
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark theme">
          <Moon /> Dark
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="Follow system theme">
          <Monitor /> System
        </ToggleGroupItem>
      </ToggleGroup>
    </CardContent>
  </Card>
);
