import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { Party, CharacterData, MultiAccount } from '../../types/types';
import { DraggableDialog } from '../DraggableDialog';

type AdventureOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  parties: Party[];
  multiAccounts?: MultiAccount[];
};

// 다계정별 색상 매핑
const MULTI_ACCOUNT_COLORS = [
  '#FF6B6B', // 빨강
  '#4ECDC4', // 청록
  '#45B7D1', // 파랑
  '#96CEB4', // 초록
  '#FFEAA7', // 노랑
  '#DDA0DD', // 보라
  '#FFB347', // 주황
  '#98D8C8', // 민트
  '#F7DC6F', // 연노랑
  '#BB8FCE', // 연보라
  '#85C1E9', // 연파랑
  '#F8C471', // 연주황
];

export function AdventureOrderDialog({ isOpen, onClose, parties, multiAccounts = [] }: AdventureOrderDialogProps) {
  const [isMultiAccountView, setIsMultiAccountView] = useState(false);

  // 다계정별 모험단 매핑 생성
  const multiAccountMap = useMemo(() => {
    const map = new Map<string, string>();
    multiAccounts.forEach((account, index) => {
      account.adventureNames?.forEach((adventureName) => {
        map.set(adventureName, account.username);
      });
    });
    return map;
  }, [multiAccounts]);

  // 다계정별 색상 매핑 생성
  const multiAccountColors = useMemo(() => {
    const colors = new Map<string, string>();
    multiAccounts.forEach((account, index) => {
      colors.set(account.username, MULTI_ACCOUNT_COLORS[index % MULTI_ACCOUNT_COLORS.length]);
    });
    return colors;
  }, [multiAccounts]);

  // 모험단 데이터 추출 및 정렬 (다계정 모아보기 적용)
  const adventureData = useMemo(() => {
    const adventureMap = new Map<string, CharacterData>();

    // 모든 파티에서 모험단 정보 수집
    parties.forEach((party) => {
      party.slots.forEach((slot) => {
        if (slot !== 'empty' && slot.adventureName) {
          if (!adventureMap.has(slot.adventureName)) {
            adventureMap.set(slot.adventureName, slot);
          }
        }
      });
    });

    let sortedAdventures: CharacterData[];

    if (isMultiAccountView) {
      // 다계정 모아보기: 사용자명 기준으로 그룹화하여 정렬
      const groupedByUser = new Map<string, CharacterData[]>();

      Array.from(adventureMap.values()).forEach((adventure) => {
        const username = multiAccountMap.get(adventure.adventureName) || adventure.adventureName;
        if (!groupedByUser.has(username)) {
          groupedByUser.set(username, []);
        }
        groupedByUser.get(username)!.push(adventure);
      });

      // 사용자명 기준 오름차순 정렬 후, 각 사용자 내에서 모험단명 정렬
      sortedAdventures = Array.from(groupedByUser.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([username, adventures]) => adventures.sort((a, b) => a.adventureName.localeCompare(b.adventureName)));
    } else {
      // 일반 모아보기: 모험단명 기준 오름차순 정렬
      sortedAdventures = Array.from(adventureMap.values()).sort((a, b) => a.adventureName.localeCompare(b.adventureName));
    }

    // 색상 할당
    const adventureColors = new Map<string, string>();
    if (isMultiAccountView) {
      // 다계정 모아보기: 사용자별 색상 할당
      sortedAdventures.forEach((adventure) => {
        const username = multiAccountMap.get(adventure.adventureName) || adventure.adventureName;
        adventureColors.set(adventure.adventureName, multiAccountColors.get(username) || '#ccc');
      });
    } else {
      // 일반 모아보기: 모험단별 색상 할당
      sortedAdventures.forEach((adventure, index) => {
        adventureColors.set(adventure.adventureName, MULTI_ACCOUNT_COLORS[index % MULTI_ACCOUNT_COLORS.length]);
      });
    }

    return {
      adventures: sortedAdventures,
      colors: adventureColors,
    };
  }, [parties, isMultiAccountView, multiAccountMap, multiAccountColors]);

  // 파티별 모험단 순서 매트릭스 생성
  const partyMatrix = useMemo(() => {
    return parties.map((party) => {
      const partyAdventures = new Map<string, number>();

      party.slots.forEach((slot, index) => {
        if (slot !== 'empty' && slot.adventureName) {
          partyAdventures.set(slot.adventureName, index + 1);
        }
      });

      return partyAdventures;
    });
  }, [parties]);

  return (
    <DraggableDialog
      isOpen={isOpen}
      onClose={onClose}
      title="모험단 순서"
      dialogId="adventure-order-dialog"
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 800, height: 600 }}
      minSize={{ width: 600, height: 400 }}
    >
      <DialogContent>
        <DialogHeader>
          <ViewToggle>
            <ToggleLabel>
              <input type="checkbox" checked={isMultiAccountView} onChange={(e) => setIsMultiAccountView(e.target.checked)} />
              다계정 모아보기
            </ToggleLabel>
          </ViewToggle>
        </DialogHeader>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>모험단</th>
                {parties.map((party, index) => (
                  <th key={party.id}>{party.title || `${index + 1}파티`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adventureData.adventures.map((adventure) => {
                const username = multiAccountMap.get(adventure.adventureName);
                const displayName = isMultiAccountView && username ? username : adventure.adventureName;
                const isMultiAccount = isMultiAccountView && !!username;

                return (
                  <tr key={adventure.adventureName}>
                    <td>
                      <AdventureName>
                        <ColorBox color={adventureData.colors.get(adventure.adventureName) || '#ccc'} isMultiAccount={isMultiAccount} />
                        {displayName}
                        {isMultiAccount && <MultiAccountBadge>{adventure.adventureName}</MultiAccountBadge>}
                      </AdventureName>
                    </td>
                    {parties.map((party, partyIndex) => {
                      const order = partyMatrix[partyIndex].get(adventure.adventureName);
                      return (
                        <td key={party.id}>
                          {order ? (
                            <OrderCell color={adventureData.colors.get(adventure.adventureName) || '#ccc'} isMultiAccount={isMultiAccount}>
                              {order}
                            </OrderCell>
                          ) : (
                            <EmptyCell>-</EmptyCell>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer>

        <Legend>
          <LegendTitle>색상 범례:</LegendTitle>
          <LegendItems>
            {adventureData.adventures.map((adventure) => {
              const username = multiAccountMap.get(adventure.adventureName);
              const displayName = isMultiAccountView && username ? username : adventure.adventureName;
              const isMultiAccount = isMultiAccountView && !!username;

              return (
                <LegendItem key={adventure.adventureName}>
                  <ColorBox color={adventureData.colors.get(adventure.adventureName) || '#ccc'} isMultiAccount={isMultiAccount} />
                  <span>{displayName}</span>
                  {isMultiAccount && <MultiAccountBadge>{adventure.adventureName}</MultiAccountBadge>}
                </LegendItem>
              );
            })}
          </LegendItems>
        </Legend>
      </DialogContent>
    </DraggableDialog>
  );
}

const DialogContent = styled.div`
  padding: 20px;
  overflow-y: auto;
  height: 100%;
`;

const DialogHeader = styled.div`
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
`;

const ViewToggle = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const AdventureName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  white-space: nowrap;
`;

const ColorBox = styled.div<{ color: string; isMultiAccount?: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: ${(props) => (props.isMultiAccount ? '4px' : '3px')};
  background-color: ${(props) => props.color};
  flex-shrink: 0;
`;

const MultiAccountBadge = styled.span`
  font-size: 11px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
  font-weight: normal;
`;

const OrderCell = styled.div<{ color: string; isMultiAccount?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${(props) => (props.isMultiAccount ? '6px' : '50%')};
  background-color: ${(props) => props.color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  margin: 0 auto;
`;

const EmptyCell = styled.div`
  text-align: center;
  color: #ccc;
  font-size: 14px;
`;

const Legend = styled.div`
  border-top: 1px solid #eee;
  padding-top: 16px;
`;

const LegendTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const LegendItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
`;
