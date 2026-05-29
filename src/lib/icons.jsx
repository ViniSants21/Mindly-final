import {
  Calculator,
  BookOpen,
  Target,
  Clipboard,
  Beaker,
  PenTool,
  Zap,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coins,
  Star,
  Menu,
  LogOut,
  User,
  Home,
  Award,
  TrendingUp,
  Gift,
  Flame,
  Brain,
  Lightbulb,
  Trophy,
  Calendar,
  X,
  BarChart2,
  Clock,
  Medal,
} from "lucide-react";

/**
 * Mapa central de ícones do Mindly.
 * Permite referenciar ícones por nome (string) — útil porque os
 * desafios guardam apenas o nome do ícone no banco de dados.
 */
export const iconMap = {
  // Desafios / disciplinas
  math: Calculator,
  book: BookOpen,
  target: Target,
  clipboard: Clipboard,
  flask: Beaker,
  pen: PenTool,
  brain: Brain,

  // Status
  lock: Lock,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,

  // Gerais
  coins: Coins,
  star: Star,
  menu: Menu,
  logout: LogOut,
  user: User,
  home: Home,
  award: Award,
  trending: TrendingUp,
  gift: Gift,
  lightning: Zap,
  flame: Flame,
  lightbulb: Lightbulb,

  // Performance / Gamificação
  trophy: Trophy,
  calendar: Calendar,
  close: X,
  barchart: BarChart2,
  clock: Clock,
  medal: Medal,
};

const DEFAULT_COLOR = "#f59a3c";

/**
 * Renderiza um ícone pelo nome.
 * @param {string} iconName chave em {@link iconMap}
 * @param {object} props props extra repassadas ao componente lucide
 */
export function getIcon(iconName, props = {}) {
  const IconComponent = iconMap[iconName] || Star;
  return <IconComponent size={24} color={DEFAULT_COLOR} {...props} />;
}

/** Lista de nomes de ícones disponíveis (para selects no Admin). */
export const availableIconNames = Object.keys(iconMap);
