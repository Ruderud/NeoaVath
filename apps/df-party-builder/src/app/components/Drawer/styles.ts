import styled from '@emotion/styled';

export const DrawerContainer = styled.div<{ open: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${({ open }) => (open ? '280px' : '80px')};
  background: #1a1a1a;
  border-right: 1px solid #333;
  transition: width 0.3s ease;
  z-index: 100;
`;

export const DrawerContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
  gap: 12px;
`;

export const DrawerTitle = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
  flex: 1;
`;

export const DundamIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 4px;
`;

export const DrawerMenu = styled.nav`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DrawerMenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #2a2a2a;
  }
`;

export const DrawerCollapseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #ccc;
  }
`;

export const DrawerCollapsed = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
`;

export const DrawerExpandButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: #ccc;
  }
`;

export const DrawerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
`;
