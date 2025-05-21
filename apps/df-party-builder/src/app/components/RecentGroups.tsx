import { Link } from 'react-router-dom';
import { RecentGroup } from '../types/types';
import styled from '@emotion/styled';

type RecentGroupProps = {
  recentGroups: RecentGroup[];
};

export function RecentGroups(props: RecentGroupProps) {
  const { recentGroups } = props;

  if (recentGroups.length === 0) {
    return (
      <RecentGroupsContainer>
        <RecentGroupsTitle>최근 참여한 그룹</RecentGroupsTitle>
        <NoRecentGroups>최근 참여한 그룹이 없습니다</NoRecentGroups>
      </RecentGroupsContainer>
    );
  }

  return (
    <RecentGroupsContainer>
      <RecentGroupsTitle>최근 참여한 그룹</RecentGroupsTitle>
      <RecentGroupsList>
        {recentGroups.map((group) => (
          <RecentGroupItem key={group.id} to={`/group/${group.id}`}>
            <span>{group.name}</span>
            <span>{new Date(group.lastVisited).toLocaleDateString()}</span>
          </RecentGroupItem>
        ))}
      </RecentGroupsList>
    </RecentGroupsContainer>
  );
}

const NoRecentGroups = styled.p`
  color: #666;
  font-style: italic;
`;

const RecentGroupsContainer = styled.div`
  margin-top: 60px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 12px;
`;

const RecentGroupsTitle = styled.h2`
  font-size: 1.5em;
  color: #333;
  margin-bottom: 20px;
`;

const RecentGroupsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RecentGroupItem = styled(Link)`
  padding: 12px 20px;
  background-color: white;
  border-radius: 6px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #e9e9e9;
  }
`;
