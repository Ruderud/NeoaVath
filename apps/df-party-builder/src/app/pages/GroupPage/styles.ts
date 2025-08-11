import styled from '@emotion/styled';

type PageContainerProps = {
  drawerOpen: boolean;
};

export const PageContainer = styled.div<PageContainerProps>`
  display: grid;
  grid-template-rows: 1fr;
  min-height: 100vh;
  max-width: 100vw
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

  &:first-of-type {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
`;

export const ResizeHandler = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  background: #2196f3;
  border-radius: 0 0 0 8px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.2s ease;

  &:hover {
    background: #1976d2;
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 1px;
    opacity: 0.8;
  }

  &:active {
    background: #1565c0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.5em;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

export const KanbanBoard = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 8px 4px;
  margin: 0 -4px;
  flex: 1;
  min-height: 0;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

export const AddDungeonColumn = styled.div`
  min-width: 300px;
  max-width: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  height: fit-content;
`;

export const AddDungeonForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const AddDungeonInput = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export const AddGroupButtonRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const AddGroupButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    border-color: #2196f3;
    color: #2196f3;
  }
`;

export const CancelButton = styled.button`
  padding: 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background: #e0e0e0;
  }
`;

export const AddDungeonButton = styled.button`
  padding: 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background: #1976d2;
  }
`;

export const Button = styled.button`
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
