/**
 * TopNavigation Component
 *
 * Top navigation bar with breadcrumbs and global actions.
 */
import { Link } from 'react-router-dom';

interface TopNavigationProps {
  projectId: string;
  sceneId: string;
  sceneHeading?: string;
}

export function TopNavigation({
  projectId,
  sceneId,
  sceneHeading,
}: TopNavigationProps) {
  return (
    <nav className="top-navigation">
      {/* Breadcrumbs */}
      <div className="top-navigation__breadcrumbs">
        <Link
          to={`/project/${projectId}`}
          className="top-navigation__breadcrumb"
        >
          Projects
        </Link>
        <span className="top-navigation__separator">/</span>
        <Link
          to={`/project/${projectId}/script`}
          className="top-navigation__breadcrumb"
        >
          Script
        </Link>
        <span className="top-navigation__separator">/</span>
        <span className="top-navigation__breadcrumb top-navigation__breadcrumb--current">
          {sceneHeading || 'Scene'}
        </span>
      </div>

      {/* Actions */}
      <div className="top-navigation__actions">
          <button
              type="button"
              className="top-navigation__action"
              title="Export Scene"
          >
              📤 Export
          </button>
          <button
              type="button"
              className="top-navigation__action"
              title="Scene Settings"
          >
              ⚙️ Settings
          </button>
          <Link
              to={`/project/${projectId}/settings`}
              className="top-navigation__action"
              title="Project Settings"
          >
              📋 Project
          </Link>
      </div>
    </nav>
  );
}
