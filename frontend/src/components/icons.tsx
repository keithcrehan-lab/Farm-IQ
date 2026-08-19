import type { CSSProperties, ReactElement } from 'react';
import type { AlertCategory } from '../api/dashboard';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

function base({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-6h6v6" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

export function HerdIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <ellipse cx="12" cy="14" rx="7" ry="5.5" />
      <path d="M7 10.5L5 6l3.5 2.2" />
      <path d="M17 10.5L19 6l-3.5 2.2" />
      <circle cx="9.5" cy="14" r="0.6" fill={props.color ?? 'currentColor'} />
      <circle cx="14.5" cy="14" r="0.6" fill={props.color ?? 'currentColor'} />
    </svg>
  );
}

export function MoneyIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8.5c-.7-.6-1.7-1-2.8-1-2.3 0-4.2 2-4.2 4.5s1.9 4.5 4.2 4.5c1.1 0 2.1-.4 2.8-1" />
      <path d="M7 10.5h6.5M7 13.5h6.5" />
    </svg>
  );
}

export function AssistantIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M21 11.5a8.5 8.5 0 01-12.5 7.5L3 20l1.2-5.3A8.5 8.5 0 1121 11.5z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
    </svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base({ ...props, strokeWidth: props.strokeWidth ?? 2.4 })} style={props.style}>
      <path d="M7 17L17 7M17 7H9M17 7v8" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base({ ...props, strokeWidth: props.strokeWidth ?? 2.2 })} style={props.style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function SoilIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z" />
      <path d="M12 3v18" />
    </svg>
  );
}

export function WeightIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7v6h-6" />
    </svg>
  );
}

export function HousingIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-6h6v6" />
    </svg>
  );
}

export function GroupBuyIcon(props: IconProps) {
  return (
    <svg {...base(props)} style={props.style}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

const CATEGORY_ICON: Record<AlertCategory, (props: IconProps) => ReactElement> = {
  housing: HousingIcon,
  soil: SoilIcon,
  weight: WeightIcon,
  group_buy: GroupBuyIcon,
};

/** Matches each alert category's icon glyph — same palette the design mockups use per category. */
const CATEGORY_DEFAULT_COLOR: Record<AlertCategory, string> = {
  housing: 'var(--red)',
  soil: 'var(--gold-deep)',
  weight: 'var(--gold-deep)',
  group_buy: 'var(--forest)',
};

export function CategoryIcon({ category, color, ...props }: IconProps & { category: AlertCategory }) {
  const Icon = CATEGORY_ICON[category];
  return <Icon {...props} color={color ?? CATEGORY_DEFAULT_COLOR[category]} />;
}
