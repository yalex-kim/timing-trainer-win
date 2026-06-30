import type { UserProfile } from '@/types/evaluation';

interface AppHeaderProps {
  serialStatus: { isConnected: boolean; portPath: string };
  userProfile: UserProfile | null;
  onEditUser?: () => void;
  onOpenSettings?: () => void;
  breadcrumb?: { parent: string; current: string; onParentClick?: () => void };
}

/**
 * 모든 화면(홈/훈련설정/검사/보고서/설정) 상단에 공통으로 쓰이는 헤더 바.
 * TT 로고 + 버전 칩(+ breadcrumb) | 시리얼 상태 pill + 사용자 칩 + 설정 톱니바퀴
 */
export default function AppHeader({ serialStatus, userProfile, onEditUser, onOpenSettings, breadcrumb }: AppHeaderProps) {
  return (
    <div className="h-[60px] flex-none flex items-center justify-between px-[26px] border-b border-tt-border-alt bg-tt-card">
      <div className="flex items-center gap-[13px]">
        <div className="w-[30px] h-[30px] rounded-[7px] border-[1.5px] border-tt-teal text-tt-teal flex items-center justify-center font-extrabold text-xs tracking-wide">
          TT
        </div>
        {breadcrumb ? (
          <span className="font-mono text-xs text-tt-light-muted-alt">
            {breadcrumb.onParentClick ? (
              <button onClick={breadcrumb.onParentClick} className="hover:text-tt-teal transition-colors">
                {breadcrumb.parent}
              </button>
            ) : (
              breadcrumb.parent
            )}
            &nbsp;/&nbsp;
            <span className="text-tt-heading font-semibold">{breadcrumb.current}</span>
          </span>
        ) : (
          <>
            <span className="font-bold text-[15px] text-tt-heading tracking-tight">Timing&nbsp;Trainer</span>
            <span className="font-mono text-[11px] text-tt-light-muted-alt">v{__APP_VERSION__}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-[18px]">
        <span className="font-mono text-xs text-tt-light-muted-alt flex items-center gap-[7px]">
          <span className={`w-1.5 h-1.5 rounded-full ${serialStatus.isConnected ? 'bg-emerald-500' : 'bg-[#c4ccd0]'}`} />
          {serialStatus.isConnected ? serialStatus.portPath : 'NO DEVICE'}
        </span>

        {userProfile && (
          <button
            onClick={onEditUser}
            className="text-[13px] text-tt-muted-alt font-semibold hover:text-tt-teal transition-colors"
          >
            {userProfile.name} <span className="text-tt-light-muted font-medium">· 만 {userProfile.age}세</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-[7px] border border-tt-border-alt bg-tt-card text-tt-muted-alt flex items-center justify-center hover:border-tt-teal hover:text-tt-teal transition-colors"
            title="설정"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
