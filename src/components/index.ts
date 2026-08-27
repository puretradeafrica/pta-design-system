/**
 * Layer 3 barrel.
 *
 * Applications compose these. A builder who reaches for `<DataTable>` and
 * `<StatusPill>` cannot produce a board that diverges from every other PTA board,
 * which is the point tokens alone cannot deliver.
 */

export { Button } from "./Button.tsx";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.tsx";

export { Badge, StatusPill, StagePill, Avatar } from "./Badge.tsx";
export type { BadgeProps, BadgeTone, StatusPillProps, StagePillProps, AvatarProps } from "./Badge.tsx";

export { DataTable, CellStack, Empty, Num } from "./DataTable.tsx";
export type { Column, TableGroup, DataTableProps, Align, Density } from "./DataTable.tsx";

export { PageHeader, Wordmark, Sidebar, Card, Toolbar, KpiStrip } from "./Shell.tsx";
export type { PageHeaderProps, NavItem, SidebarProps, Kpi } from "./Shell.tsx";

export { TextInput, Field, Modal, EmptyState, Toast } from "./Feedback.tsx";
export type { TextInputProps, FieldProps, ModalProps, ToastTone } from "./Feedback.tsx";
