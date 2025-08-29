import { X } from 'lucide-react';
import styled from '@emotion/styled';
import { useCharacterDetail } from '../../context/CharacterDetailContext';
import { DundamIcon } from '../Drawer/styles';
import { getCharacterColor } from '../../consts/character-colors';

export function CharacterDetailModal() {
  const { isOpen, selectedCharacter, hideCharacterDetail } = useCharacterDetail();
  const showMultipleBuffScore =
    selectedCharacter?.position === '버퍼' && Boolean(selectedCharacter?.buffScore && selectedCharacter?.buffScore3 && selectedCharacter?.buffScore4);

  const handleDundamClick = () => {
    if (selectedCharacter) {
      const dundamUrl = `https://dundam.xyz/character?server=${selectedCharacter.server}&key=${selectedCharacter.key}`;
      window.open(dundamUrl, '_blank');
    }
  };

  if (!isOpen || !selectedCharacter) return null;

  const characterColor = getCharacterColor(selectedCharacter.position);

  return (
    <ModalOverlay onClick={hideCharacterDetail}>
      <ModalContent onClick={(e) => e.stopPropagation()} characterColor={characterColor.gradient}>
        <ModalHeader>
          <ModalTitle>캐릭터 정보</ModalTitle>
          <CloseButton onClick={hideCharacterDetail}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <CharacterImage>
            <img
              src={`https://img-api.neople.co.kr/df/servers/${selectedCharacter.server}/characters/${selectedCharacter.key}?zoom=1`}
              alt={`${selectedCharacter.name} 캐릭터 이미지`}
            />
          </CharacterImage>
          <CharacterInfo>
            <InfoRow>
              <InfoLabel>캐릭터명</InfoLabel>
              <InfoValue>{selectedCharacter.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>서버</InfoLabel>
              <InfoValue>{selectedCharacter.server}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>직업</InfoLabel>
              <InfoValue>{selectedCharacter.job}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>명성</InfoLabel>
              <InfoValue>{selectedCharacter.level}</InfoValue>
            </InfoRow>
            {selectedCharacter.position === '버퍼' && selectedCharacter.buffScore && (
              <InfoRow>
                <InfoLabel>버프력</InfoLabel>
                {!showMultipleBuffScore && <InfoValue>{selectedCharacter.buffScore}</InfoValue>}

                {showMultipleBuffScore && <InfoValue>(2인) {selectedCharacter.buffScore}</InfoValue>}
                {showMultipleBuffScore && <InfoValue>(3인) {selectedCharacter.buffScore3}</InfoValue>}
                {showMultipleBuffScore && <InfoValue>(4인) {selectedCharacter.buffScore4}</InfoValue>}
              </InfoRow>
            )}
            {selectedCharacter.rankDamage && (
              <InfoRow>
                <InfoLabel>랭킹 데미지</InfoLabel>
                <InfoValue>{selectedCharacter.rankDamage}</InfoValue>
              </InfoRow>
            )}
            {selectedCharacter.adventureName && (
              <InfoRow>
                <InfoLabel>모험단</InfoLabel>
                <InfoValue>{selectedCharacter.adventureName}</InfoValue>
              </InfoRow>
            )}
          </CharacterInfo>
        </ModalBody>
        <ModalFooter>
          <DundamButton onClick={handleDundamClick}>
            <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" />
            던담 페이지 이동
          </DundamButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div<{ characterColor?: string }>`
  background: ${({ characterColor }) => characterColor || 'white'};
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const CharacterImage = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CharacterInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const InfoLabel = styled.div`
  width: 100px;
  color: #666;
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  flex: 1;
  font-weight: 500;
  color: #333;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
`;

const DundamButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
  }

  &:active {
    background: #004085;
  }
`;
