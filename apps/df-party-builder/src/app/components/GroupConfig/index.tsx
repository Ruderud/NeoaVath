import { useState } from 'react';
import styled from '@emotion/styled';
import { Plus, X } from 'lucide-react';
import type { GroupConfig, Tag } from '../../types/types';
import { Chip } from '../Chip';
import { ColorPicker } from '../ColorPicker';

type GroupConfigProps = {
  config: GroupConfig;
  onConfigChange: (config: GroupConfig) => void;
};

export function GroupConfigComponent({ config, onConfigChange }: GroupConfigProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#E3F2FD');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: {
        background: selectedColor,
        text: getContrastColor(selectedColor),
        border: adjustColor(selectedColor, -20),
      },
    };

    onConfigChange({
      ...config,
      tags: [...config.tags, newTag],
      updatedAt: new Date().toISOString(),
    });

    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = (tagId: string) => {
    onConfigChange({
      ...config,
      tags: config.tags.filter((tag) => tag.id !== tagId),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Container>
      <Title>그룹 태그 설정</Title>
      <TagList>
        {config.tags.map((tag) => (
          <TagItem key={tag.id}>
            <Chip color={tag.color} value={tag.name} />
            <DeleteButton onClick={() => handleDeleteTag(tag.id)}>
              <X size={16} />
            </DeleteButton>
          </TagItem>
        ))}
        {isAddingTag ? (
          <TagForm>
            <TagInput type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="태그 이름" autoFocus />
            <ColorPicker value={selectedColor} onChange={setSelectedColor} label="색상 선택" />
            <AddButton onClick={handleAddTag}>추가</AddButton>
            <CancelButton onClick={() => setIsAddingTag(false)}>취소</CancelButton>
          </TagForm>
        ) : (
          <AddTagButton onClick={() => setIsAddingTag(true)}>
            <Plus size={16} />
            태그 추가
          </AddTagButton>
        )}
      </TagList>
    </Container>
  );
}

const Container = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DeleteButton = styled.button`
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

const TagForm = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TagInput = styled.input`
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const AddButton = styled.button`
  padding: 4px 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #1976d2;
  }
`;

const CancelButton = styled.button`
  padding: 4px 12px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #e0e0e0;
  }
`;

const AddTagButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #e0e0e0;
  }
`;

function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

function adjustColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
