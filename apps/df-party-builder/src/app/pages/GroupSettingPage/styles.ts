import styled from '@emotion/styled';

type PageContainerProps = {
  drawerOpen: boolean;
};

export const PageContainer = styled.div<PageContainerProps>`
  display: grid;
  grid-template-rows: 1fr;
  min-height: 100vh;
  max-width: 100vw;
  background: #f5f5f5;
  margin-left: ${({ drawerOpen }) => (drawerOpen ? '280px' : '80px')};
  transition: margin-left 0.3s ease;
  width: calc(100% - ${({ drawerOpen }) => (drawerOpen ? '280px' : '80px')});
`;

export const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  height: 100%;
  max-width: 100%;
  max-height: 100vh;
  margin: 0;
  overflow: hidden;
  position: relative;
`;

export const Section = styled.section`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  position: relative;
`;

export const SectionTitle = styled.h2`
  font-size: 1.5em;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 32px;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;

  &:hover {
    background: #e0e0e0;
    border-color: #ccc;
  }
`;

export const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #2196f3;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;

  &:hover:not(:disabled) {
    background: #1976d2;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;

  &:hover:not(:disabled) {
    background: #e0e0e0;
    border-color: #ccc;
  }

  &:disabled {
    background: #f9f9f9;
    color: #ccc;
    cursor: not-allowed;
  }
`;

export const SettingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SettingItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SettingLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
  font-size: 1em;
`;

export const SettingInput = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export const SettingTextarea = styled.textarea`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export const SettingButton = styled.button`
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;

  &:hover {
    background: #1976d2;
  }
`;

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

export const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: default;
`;

export const TagButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const TagInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export const ColorPicker = styled.input`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
`;

export const MultiAccountContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MultiAccountItem = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
`;

export const AdventureNameList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const AdventureNameItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 16px;
  font-size: 0.9em;
  color: #1976d2;
`;
