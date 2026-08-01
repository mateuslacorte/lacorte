export interface ProjectCard {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

/** Live catalog is paused. Archived page sources live under src/archive/projects/. */
export const projects: ProjectCard[] = [];
