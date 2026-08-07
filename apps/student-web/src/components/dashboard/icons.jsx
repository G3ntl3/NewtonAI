/**
 * icons.jsx — Shared lucide-react icon components for Newton AI student dashboard.
 * Re-exported under stable names so call sites don't need to know the underlying
 * lucide icon. All accept a `className` prop for sizing/colouring via Tailwind.
 */
import {
  Home,
  BookOpen,
  Layers,
  Target,
  Bookmark,
  BarChart3,
  MessageCircle,
  Trophy,
  FlaskConical,
  User,
  Bell,
  Play,
  ChevronRight,
  PlusCircle,
  CheckCircle,
  Search,
  LogOut,
  Flame,
  Zap,
  Dna,
  Brain,
  Flag,
  Check,
  Calculator,
  Clock,
  X,
  ArrowLeft,
  Repeat,
  History,
  Settings,
  LifeBuoy,
  Plus,
  Lightbulb,
  Pencil,
  MoreVertical,
  ChevronLeft,
} from 'lucide-react';

export const HomeIcon = ({ className = 'w-5 h-5' }) => <Home className={className} strokeWidth={1.8} />;
export const BookIcon = ({ className = 'w-5 h-5' }) => <BookOpen className={className} strokeWidth={1.8} />;
export const CardsIcon = ({ className = 'w-5 h-5' }) => <Layers className={className} strokeWidth={1.8} />;
export const TargetIcon = ({ className = 'w-5 h-5' }) => <Target className={className} strokeWidth={1.8} />;

export const BookmarkIcon = ({ className = 'w-5 h-5', filled = false }) => (
  <Bookmark className={className} strokeWidth={1.8} fill={filled ? 'currentColor' : 'none'} />
);

export const ChartIcon = ({ className = 'w-5 h-5' }) => <BarChart3 className={className} strokeWidth={1.8} />;
export const ChatIcon = ({ className = 'w-5 h-5' }) => <MessageCircle className={className} strokeWidth={1.8} />;
export const TrophyIcon = ({ className = 'w-5 h-5' }) => <Trophy className={className} strokeWidth={1.8} />;
export const FlaskIcon = ({ className = 'w-5 h-5' }) => <FlaskConical className={className} strokeWidth={1.8} />;
export const UserIcon = ({ className = 'w-5 h-5' }) => <User className={className} strokeWidth={1.8} />;
export const BellIcon = ({ className = 'w-5 h-5' }) => <Bell className={className} strokeWidth={1.8} />;
export const PlayIcon = ({ className = 'w-5 h-5' }) => <Play className={className} fill="currentColor" stroke="none" />;
export const ChevronRightIcon = ({ className = 'w-5 h-5' }) => <ChevronRight className={className} strokeWidth={1.8} />;
export const PlusCircleIcon = ({ className = 'w-5 h-5' }) => <PlusCircle className={className} strokeWidth={1.8} />;
export const CheckCircleIcon = ({ className = 'w-5 h-5' }) => <CheckCircle className={className} strokeWidth={1.8} />;
export const SearchIcon = ({ className = 'w-5 h-5' }) => <Search className={className} strokeWidth={1.8} />;
export const LogOutIcon = ({ className = 'w-5 h-5' }) => <LogOut className={className} strokeWidth={1.8} />;

export const FlameIcon = ({ className = 'w-5 h-5' }) => <Flame className={className} strokeWidth={1.8} />;
export const ZapIcon = ({ className = 'w-5 h-5' }) => <Zap className={className} strokeWidth={1.8} />;
export const DnaIcon = ({ className = 'w-5 h-5' }) => <Dna className={className} strokeWidth={1.8} />;
export const BrainIcon = ({ className = 'w-5 h-5' }) => <Brain className={className} strokeWidth={1.8} />;
export const FlagIcon = ({ className = 'w-5 h-5' }) => <Flag className={className} strokeWidth={1.8} />;
export const CheckIcon = ({ className = 'w-5 h-5' }) => <Check className={className} strokeWidth={2.2} />;
export const CalculatorIcon = ({ className = 'w-5 h-5' }) => <Calculator className={className} strokeWidth={1.8} />;
export const ClockIcon = ({ className = 'w-5 h-5' }) => <Clock className={className} strokeWidth={1.8} />;
export const XIcon = ({ className = 'w-5 h-5' }) => <X className={className} strokeWidth={1.8} />;
export const ArrowLeftIcon = ({ className = 'w-5 h-5' }) => <ArrowLeft className={className} strokeWidth={1.8} />;
export const RepeatIcon = ({ className = 'w-5 h-5' }) => <Repeat className={className} strokeWidth={1.8} />;
export const HistoryIcon = ({ className = 'w-5 h-5' }) => <History className={className} strokeWidth={1.8} />;
export const SettingsIcon = ({ className = 'w-5 h-5' }) => <Settings className={className} strokeWidth={1.8} />;
export const LifeBuoyIcon = ({ className = 'w-5 h-5' }) => <LifeBuoy className={className} strokeWidth={1.8} />;
export const PlusIcon = ({ className = 'w-5 h-5' }) => <Plus className={className} strokeWidth={2.2} />;
export const LightbulbIcon = ({ className = 'w-5 h-5' }) => <Lightbulb className={className} strokeWidth={1.8} />;
export const PencilIcon = ({ className = 'w-5 h-5' }) => <Pencil className={className} strokeWidth={1.8} />;
export const MoreVerticalIcon = ({ className = 'w-5 h-5' }) => <MoreVertical className={className} strokeWidth={1.8} />;
export const ChevronLeftIcon = ({ className = 'w-5 h-5' }) => <ChevronLeft className={className} strokeWidth={1.8} />;

/** Subject.icon (and derived bookmark subjectIcon) is a semantic key, not an emoji. */
export const SUBJECT_ICON_MAP = {
  zap: ZapIcon,
  'flask-conical': FlaskIcon,
  dna: DnaIcon,
  calculator: CalculatorIcon,
  bookmark: BookmarkIcon,
};
