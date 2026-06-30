import { vars } from './theme/tokens';

import './theme/imbustai-light.css';
import './theme/imbustai-dark.css';
import './theme/default-light.css';
import './theme/default-dark.css';

export const dsVars = {
  color: vars.color,
  space: vars.space,
  radius: vars.radius,
  shadow: vars.shadow,
} as const;

export { dsStyle } from './utils/dsStyle';
export { DsSmoke } from './_smoke/DsSmoke';
export { Typography } from './components/Typography/Typography';
export type { TypographyProps } from './components/Typography/Typography';
export { TYPOGRAPHY_SCALE } from './components/Typography/typography-scale';
export type { TypographyVariant } from './components/Typography/typography-scale';

export { Button } from './components/Button/Button';
export type { ButtonProps } from './components/Button/Button';
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/Card/Card';
export type { CardProps } from './components/Card/Card';
export { Input } from './components/Input/Input';
export type { InputProps } from './components/Input/Input';
export { Label } from './components/Label/Label';
export type { LabelProps } from './components/Label/Label';
export { Badge } from './components/Badge/Badge';
export type { BadgeProps } from './components/Badge/Badge';
export { Pill } from './components/Pill/Pill';
export type { PillProps } from './components/Pill/Pill';

// Layout
export { sprinkles } from './layout/sprinkles.css';
export type { Sprinkles } from './layout/sprinkles.css';
export { Box, Stack, Inline, Grid, Container, Spacer, Divider } from './components/layout';
export type { BoxProps, StackProps, InlineProps, GridProps, ContainerProps, SpacerProps, DividerProps } from './components/layout';

// Table
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/Table/Table';

// Tooltip
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/Tooltip/Tooltip';
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps, TooltipProviderProps } from './components/Tooltip/Tooltip';

// Textarea
export { Textarea } from './components/Textarea/Textarea';
export type { TextareaProps } from './components/Textarea/Textarea';

// Select
export { Select } from './components/Select/Select';
export type { SelectProps } from './components/Select/Select';

// Sidebar
export { Sidebar, SidebarHeader, SidebarFooter, SidebarItem } from './components/Sidebar/Sidebar';
export type { SidebarProps, SidebarHeaderProps, SidebarFooterProps, SidebarItemProps } from './components/Sidebar/Sidebar';
