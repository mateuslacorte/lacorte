import { anonymousChatSeo, categories, toolsConfig } from '@/data/tools';

export const toolsGridItems = toolsConfig.map((tool) => ({
  slug: tool.slug,
  title: {
    en: tool.seo.en.title.split(' - ')[0],
    pt: tool.seo.pt.title.split(' - ')[0],
  },
  description: {
    en: tool.seo.en.description,
    pt: tool.seo.pt.description,
  },
  icon: tool.icon,
  category: tool.category,
}));

export const toolsGridItemsWithChat = [
  ...toolsGridItems,
  {
    slug: '/anonymous-chat',
    title: {
      en: anonymousChatSeo.en.title.split(' - ')[0],
      pt: anonymousChatSeo.pt.title.split(' - ')[0],
    },
    description: {
      en: anonymousChatSeo.en.description,
      pt: anonymousChatSeo.pt.description,
    },
    icon: '💬',
    category: 'productivity',
  },
];

export { categories as toolCategories };
