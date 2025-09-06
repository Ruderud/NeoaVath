import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CharacterData } from '../../types/types';
import { ArrowLeft, FlaskConical, TestTube } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { Toast } from '../../components/Toast';
import { PageContainer, MainContent } from '../GroupPage/styles';
import { PartyOptimizer } from './Features/PartyOptimizer';
import styled from '@emotion/styled';

const FeatureSelectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
`;

const FeatureSelectionTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #374151;
`;

const FeatureSelectionDescription = styled.p`
  margin: 0 0 32px 0;
  font-size: 16px;
  line-height: 1.5;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  max-width: 600px;
  width: 100%;
`;

const FeatureCard = styled.div`
  padding: 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }
`;

const FeatureCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const FeatureIcon = styled.div`
  padding: 8px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #3b82f6;
`;

const FeatureTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
`;

const FeatureDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

export function ExperimentalPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  // URL 파라미터에서 기능 읽기
  useEffect(() => {
    const feature = searchParams.get('feature');
    if (feature) {
      setSelectedFeature(feature);
    }
  }, [searchParams]);

  // Drawer 토글 함수
  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // 더미 함수 (Drawer에서 필요하지만 이 페이지에서는 사용하지 않음)
  const handleUpdateGroupCharacters = useCallback(async () => {
    // 이 페이지에서는 사용하지 않음
  }, []);

  // 토스트 메시지 표시
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  // 최적화 실행 핸들러
  const handleOptimize = (characters: CharacterData[]) => {
    console.log('!!DEBUG 최적화 실행:', characters);
    showToast('파티 최적화 기능이 실행되었습니다.');
  };

  // 실험적 기능들 정의
  const experimentalFeatures = {
    'party-optimizer': {
      id: 'party-optimizer',
      title: '최적화 파티 생성',
      description: 'AI를 활용한 최적의 파티 조합을 제안합니다.',
      icon: <TestTube size={20} />,
    },
  };

  // 기능 선택 함수
  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    // URL 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('feature', featureId);
    navigate(`/group/${groupName}/experimental?${newSearchParams.toString()}`, { replace: true });
  };

  return (
    <>
      <Drawer
        open={isDrawerOpen}
        groupName={groupName || ''}
        onToggle={handleToggleDrawer}
        onUpdateGroupCharacters={handleUpdateGroupCharacters}
        onOpenCharacterSearch={() => {
          // 이 페이지에서는 캐릭터 검색을 사용하지 않음
        }}
      />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent style={{ backgroundColor: '#f5f5f5' }} data-main-content>
          {/* 헤더 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate(`/group/${groupName}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6b7280',
                }}
              >
                <ArrowLeft size={20} />
                뒤로가기
              </button>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>실험적 기능</h1>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FlaskConical size={16} style={{ color: '#6b7280' }} />
              <select
                value={selectedFeature || ''}
                onChange={(e) => handleFeatureSelect(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  minWidth: '200px',
                }}
              >
                <option value="">실험적 기능을 선택하세요</option>
                {Object.entries(experimentalFeatures).map(([key, feature]) => (
                  <option key={key} value={key}>
                    {feature.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedFeature ? (
            // 기능 선택 화면
            <FeatureSelectionContainer>
              <FeatureSelectionTitle>실험적 기능을 선택해주세요</FeatureSelectionTitle>
              <FeatureSelectionDescription>
                아래에서 사용하고 싶은 실험적 기능을 선택하세요.
                <br />각 기능은 특별한 AI 기반 분석과 최적화를 제공합니다.
              </FeatureSelectionDescription>
              <FeatureGrid>
                {Object.values(experimentalFeatures).map((feature) => (
                  <FeatureCard key={feature.id} onClick={() => handleFeatureSelect(feature.id)}>
                    <FeatureCardHeader>
                      <FeatureIcon>{feature.icon}</FeatureIcon>
                      <FeatureTitle>{feature.title}</FeatureTitle>
                    </FeatureCardHeader>
                    <FeatureDescription>{feature.description}</FeatureDescription>
                  </FeatureCard>
                ))}
              </FeatureGrid>
            </FeatureSelectionContainer>
          ) : (
            // 기능 실행 화면
            <div style={{ padding: '20px' }}>
              {selectedFeature === 'party-optimizer' && <PartyOptimizer groupName={groupName} onOptimize={handleOptimize} />}
            </div>
          )}
        </MainContent>
      </PageContainer>

      <Toast message={toastMessage} isVisible={isToastVisible} />
    </>
  );
}
