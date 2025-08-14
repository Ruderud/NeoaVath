import { useState } from 'react';
import { Save, Settings, Check } from 'lucide-react';

type SaveFabProps = {
  isAutoSaveEnabled: boolean;
  isSaving: boolean;
  lastSavedTime: string;
  onToggleAutoSave: () => void;
  onManualSave: () => void;
};

export function SaveFab({ isAutoSaveEnabled, isSaving, lastSavedTime, onToggleAutoSave, onManualSave }: SaveFabProps) {
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isSaveSettingsOpen, setIsSaveSettingsOpen] = useState(false);

  return (
    <>
      {/* FAB 저장 버튼 */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        {/* 저장 설정 메뉴 */}
        {isSaveMenuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '70px',
              right: '0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            {/* 자동저장 토글 (설정이 열려있을 때만) */}
            {isSaveSettingsOpen && (
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#333',
                }}
              >
                <span>자동저장</span>
                <div
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    backgroundColor: isAutoSaveEnabled ? '#007bff' : '#ccc',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={onToggleAutoSave}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: isAutoSaveEnabled ? '22px' : '2px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 저장 설정 버튼 */}
            <button
              onClick={() => setIsSaveSettingsOpen(!isSaveSettingsOpen)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Settings size={20} />
            </button>

            {/* 수동 저장 버튼 */}
            <button
              onClick={onManualSave}
              disabled={isAutoSaveEnabled}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: isAutoSaveEnabled ? '#ccc' : '#007bff',
                border: 'none',
                color: 'white',
                cursor: isAutoSaveEnabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isAutoSaveEnabled) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isSaving ? (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <Check size={12} color="white" />
                </div>
              ) : (
                <Save size={20} />
              )}
            </button>
          </div>
        )}

        {/* 메인 FAB 버튼 */}
        <button
          onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            transform: isSaveMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isSaveMenuOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isSaveMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)';
          }}
        >
          <Save size={24} />
        </button>
      </div>

      {/* 마지막 저장 시간 표시 */}
      {lastSavedTime && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 999,
          }}
        >
          마지막 저장: {lastSavedTime}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}
