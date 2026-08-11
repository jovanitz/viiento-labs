import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../cn';

/**
 * Popover (shadcn/ui over Radix). A non-menu floating panel — use THIS, not
 * DropdownMenu, when the content isn't a list of `menuitem`s (e.g. a
 * notifications panel, a form, a preview card). Token-based; animates via
 * tw-animate-css.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

/** A Select/Combobox/Popover opened from inside this popover portals its own
 *  content to `document.body`, outside this popover's DOM subtree — so the
 *  outside-click dismiss sees a plain click "outside" and closes this
 *  popover under it. Ignore outside-clicks that actually land in one of
 *  those nested popper layers (mirrors dialog.tsx's same fix).
 *
 *  Also ignore `data-radix-keep-open`: `PopoverAnchor` is, by Radix's own
 *  design, outside `PopoverContent` — so an anchor a consumer made
 *  interactive (draggable/resizable, not just a positioning point) reads as
 *  an "outside" pointerdown and the popover dismisses itself mid-gesture.
 *  Tag that anchor's root element with this attribute to opt out. */
const isInsideNestedPopper = (event: { target: EventTarget | null }) =>
  (event.target as HTMLElement | null)?.closest(
    '[data-radix-popper-content-wrapper], [data-radix-keep-open]',
  ) != null;

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
      onPointerDownOutside={(e) => {
        if (isInsideNestedPopper(e)) e.preventDefault();
      }}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
