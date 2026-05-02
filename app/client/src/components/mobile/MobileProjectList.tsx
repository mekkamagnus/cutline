import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  sceneCount: number;
  updatedAt: string;
  status: 'ready' | 'draft';
}

interface MobileProjectListProps {
  projects?: Project[];
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 'demo-project', name: 'The Last Train', sceneCount: 12, updatedAt: '4 min ago', status: 'ready' },
  { id: 'coffee-shop', name: 'Coffee Shop Meet', sceneCount: 3, updatedAt: 'Yesterday', status: 'draft' },
  { id: 'urban-pursuit', name: 'Urban Pursuit', sceneCount: 8, updatedAt: '2 days ago', status: 'ready' },
];

export function MobileProjectList({ projects = DEFAULT_PROJECTS }: MobileProjectListProps) {
  const navigate = useNavigate();

  return (
    <div className="mobile-project-list">
      <div className="mobile-project-list__actions">
        <button type="button" className="mobile-project-list__new-card">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New Project</span>
        </button>
        <button type="button" className="mobile-project-list__import-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span>Import</span>
        </button>
      </div>

      <div className="mobile-project-list__label">Recent Projects</div>

      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          className="mobile-project-card"
          onClick={() => navigate(`/project/${project.id}/script`)}
        >
          <div className="mobile-project-card__thumb">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            </svg>
          </div>
          <div className="mobile-project-card__info">
            <div className="mobile-project-card__name">{project.name}</div>
            <div className="mobile-project-card__meta">
              {project.sceneCount} scenes &bull; {project.updatedAt}
            </div>
            <span className={`badge ${project.status === 'ready' ? 'badge--success' : 'badge--warning'}`}>
              {project.status === 'ready' ? 'Ready' : 'Draft'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
