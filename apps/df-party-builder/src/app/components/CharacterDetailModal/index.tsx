import { X } from 'lucide-react';
import styled from '@emotion/styled';
import type { CharacterData } from '../../types/types';

type CharacterDetailModalProps = {
  isOpen: boolean;
  character: CharacterData | null;
  onClose: () => void;
};

export function CharacterDetailModal({ isOpen, character, onClose }: CharacterDetailModalProps) {
  if (!isOpen || !character) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>캐릭터 정보</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <CharacterImage>
            <img
              src={`https://img-api.neople.co.kr/df/servers/${character.server}/characters/${character.key}?zoom=1`}
              alt={`${character.name} 캐릭터 이미지`}
            />
          </CharacterImage>
          <CharacterInfo>
            <InfoRow>
              <InfoLabel>캐릭터명</InfoLabel>
              <InfoValue>{character.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>서버</InfoLabel>
              <InfoValue>{character.server}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>직업</InfoLabel>
              <InfoValue>{character.job}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>명성</InfoLabel>
              <InfoValue>{character.level}</InfoValue>
            </InfoRow>
            {character.buffScore && (
              <InfoRow>
                <InfoLabel>버프력</InfoLabel>
                <InfoValue>{character.buffScore}</InfoValue>
              </InfoRow>
            )}
            {character.ozma && (
              <InfoRow>
                <InfoLabel>오즈마 랭킹</InfoLabel>
                <InfoValue>{character.ozma}</InfoValue>
              </InfoRow>
            )}
            {character.adventureName && (
              <InfoRow>
                <InfoLabel>모험단</InfoLabel>
                <InfoValue>{character.adventureName}</InfoValue>
              </InfoRow>
            )}
          </CharacterInfo>
        </ModalBody>
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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
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
