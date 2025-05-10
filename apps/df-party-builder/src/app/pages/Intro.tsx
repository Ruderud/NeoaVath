import { Link } from 'react-router-dom';
import styled from '@emotion/styled';

const Container = styled.div`
  max-width: 800px;
  margin: 60px auto;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3em;
  color: #333;
  margin-bottom: 20px;
`;

const Subtitle = styled.p`
  font-size: 1.2em;
  color: #666;
  margin-bottom: 40px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
`;

const StyledLink = styled(Link)`
  padding: 15px 40px;
  border-radius: 8px;
  font-size: 1.1em;
  text-decoration: none;
  transition: all 0.3s ease;

  &.login {
    background-color: #4caf50;
    color: white;

    &:hover {
      background-color: #45a049;
    }
  }

  &.create {
    background-color: #2196f3;
    color: white;

    &:hover {
      background-color: #1976d2;
    }
  }
`;

export function Intro() {
  return (
    <Container>
      <Title>던파 파티 빌더</Title>
      <Subtitle>
        파티 구성을 쉽게 관리하고 공유하세요
        <br />
        드래그 앤 드롭으로 간편하게 파티를 구성할 수 있습니다
      </Subtitle>
      <ButtonContainer>
        <StyledLink to="/login" className="login">
          그룹 참여하기
        </StyledLink>
        <StyledLink to="/create" className="create">
          새 그룹 만들기
        </StyledLink>
      </ButtonContainer>
    </Container>
  );
}
