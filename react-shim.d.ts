// Type declarations shim for React and dependencies when @types packages aren't installed
// This allows TypeScript to compile without requiring node_modules/@types

declare module 'react' {
  export = React;
  export as namespace React;
  
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type ComponentType<P = {}> = any;
    type FC<P = {}> = (props: P) => ReactElement | null;
    
    function createContext<T>(defaultValue: T): Context<T>;
    function useContext<T>(context: Context<T>): T;
    function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function useMemo<T>(factory: () => T, deps: any[]): T;
    
    interface Context<T> {
      Provider: ComponentType<{ value: T; children?: ReactNode }>;
      Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
    }
  }
  
  const React: {
    createContext: typeof React.createContext;
    useContext: typeof React.useContext;
    useState: typeof React.useState;
    useEffect: typeof React.useEffect;
    useCallback: typeof React.useCallback;
    useMemo: typeof React.useMemo;
  };
  export default React;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function Fragment(props: { children?: any }): any;
}

declare module 'lucide-react' {
  export const Check: any;
  export const X: any;
  export const Merge: any;
  export const Scissors: any;
  export const SkipForward: any;
  export const Info: any;
  export const Search: any;
  export const Filter: any;
  export const Undo2: any;
  export const ChevronDown: any;
  export const ChevronRight: any;
  export const Home: any;
  export const Users: any;
  export const BarChart3: any;
  export const FolderKanban: any;
  export const Brain: any;
  export const CheckCircle2: any;
  export const XCircle: any;
  export const TrendingUp: any;
  export const Award: any;
  export const Clock: any;
  export const Target: any;
  export const CheckCircle: any;
  export const Activity: any;
}

declare module 'recharts' {
  export const PieChart: any;
  export const Pie: any;
  export const Cell: any;
  export const LineChart: any;
  export const Line: any;
  export const BarChart: any;
  export const Bar: any;
  export const XAxis: any;
  export const YAxis: any;
  export const CartesianGrid: any;
  export const Tooltip: any;
  export const Legend: any;
  export const ResponsiveContainer: any;
}

declare module 'sonner' {
  export interface ToasterProps {
    theme?: string;
    className?: string;
    style?: any;
  }
  export function Toaster(props: ToasterProps): any;
}

declare module 'next-themes' {
  export function useTheme(): { theme: string };
}
