// Job site info type definitions

export interface JobSite {
  id: string;
  name: string;
  color: string;
  url: string;
  status: 'link-only';
  jobCount: number;
}

export interface JobsData {
  jobs: [];
  sites: JobSite[];
  lastUpdated: string;
}
