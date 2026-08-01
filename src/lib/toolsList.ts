import { categories, toolsConfig } from '@/data/tools';

export const toolsGridItems = toolsConfig.map((tool) => ({
  slug: tool.slug,
  title: { en: tool.seo.en.title.split(' - ')[0] },
  description: { en: tool.seo.en.description },
  icon: tool.icon,
  category: tool.category,
}));

export const toolsGridItemsWithChat = [
  ...toolsGridItems,
  {
    slug: '/anonymous-chat',
    title: { en: 'Anonymous Chat' },
    description: { en: 'Anonymous 1:1 real-time chat. P2P connection, nothing stored on servers.' },
    icon: '💬',
    category: 'productivity',
  },
];

export { categories as toolCategories };
