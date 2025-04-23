export interface AttentionItem {
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
}

export interface AttentionBlockProps {
  items: AttentionItem[];
} 